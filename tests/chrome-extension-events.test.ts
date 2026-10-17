import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { createContext as createVmContext, runInContext } from 'node:vm';

let listener: (info: object) => void;
let afterEvaluation: (() => void) | undefined;
let vmContext = createVmContext({});
const polls: (() => void)[] = [];

mock.module('../frontend/chrome/ChromePageManager', () => ({
  createTarget: (): string => 'session',
  waitForDomReadyInTarget: (): undefined => undefined,
  RuntimeEvaluate: (_session: string, expression: (...args: never[]) => unknown, args = []): unknown => {
    const result: unknown = runInContext(`(${expression.toString()})(...${JSON.stringify(args)})`, vmContext);
    const snapshot: unknown = result === undefined ? undefined : JSON.parse(JSON.stringify(result));
    const hook = afterEvaluation;
    afterEvaluation = undefined;
    hook?.();

    return snapshot;
  },
}));
mock.module('@steambrew/client', () => ({
  ChromeDevToolsProtocol: { send: (): object => ({}) },
}));
mock.module('stores/extensionsStore', () => ({ useExtensionsStore: {} }));

const { persistentExtensionsPage: page } = await import('../frontend/chrome/ChromeExtensionPageManager');

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

async function poll(): Promise<void> {
  const next = polls.shift();
  expect(next).toBeDefined();
  next?.();
  await settle();
}

function emit(eventType: string, itemId: string): void {
  listener({ event_type: eventType, item_id: itemId });
}

beforeEach(async () => {
  vmContext = createVmContext({
    window: {},
    document: {},
    chrome: {
      developerPrivate: {
        onItemStateChanged: {
          addListener: (callback: typeof listener) => {
            listener = callback;
          },
        },
      },
    },
  });
  spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
    polls.push(callback);

    return 0;
  }) as typeof setTimeout);
  await page.initialize();
  await settle();
});

afterEach(async () => {
  await page.destroy();
  polls.length = 0;
  afterEvaluation = undefined;
  mock.restore();
});

test('dispatches interleaved state changes in their original order', async () => {
  const seen: string[] = [];
  page.on('LOADED', (id) => {
    seen.push(`loaded:${id}`);
  });
  page.on('UNLOADED', (id) => {
    seen.push(`unloaded:${id}`);
  });
  emit('LOADED', 'extension');
  emit('UNLOADED', 'extension');
  emit('LOADED', 'extension');
  await poll();
  expect(seen).toEqual(['loaded:extension', 'unloaded:extension', 'loaded:extension']);
});

test('keeps events arriving after the snapshot for the next poll', async () => {
  const seen: string[] = [];
  page.on('INSTALLED', (id) => {
    seen.push(id);
  });
  emit('INSTALLED', 'first');
  afterEvaluation = (): void => {
    emit('INSTALLED', 'second');
  };
  await poll();
  expect(seen).toEqual(['first']);
  await poll();
  expect(seen).toEqual(['first', 'second']);
  await poll();
  expect(seen).toEqual(['first', 'second']);
});

test('finishes asynchronous installation before dispatching removal', async () => {
  const seen: string[] = [];
  let finish: (() => void) | undefined;
  const manifest = new Promise<void>((resolve) => {
    finish = resolve;
  });
  page.on('INSTALLED', async () => {
    await manifest;
    seen.push('installed');
  });
  page.on('UNINSTALLED', () => {
    seen.push('removed');
  });
  emit('INSTALLED', 'extension');
  emit('UNINSTALLED', 'extension');
  await poll();
  expect(seen).toEqual([]);
  finish?.();
  await settle();
  expect(seen).toEqual(['installed', 'removed']);
});

test('delivers extension info and ignores untracked events', async () => {
  const callback = mock(() => undefined);
  page.on('LOADED', callback);
  listener({ event_type: 'LOADED', item_id: 'extension', extensionInfo: { id: 'extension', state: 'ENABLED' } });
  emit('PREFS_CHANGED', 'extension');
  await poll();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith('extension', { id: 'extension', state: 'ENABLED' });
});

test('continues delivering events after an asynchronous listener rejects', async () => {
  const error = new Error('manifest unavailable');
  const log = spyOn(console, 'error').mockImplementation(() => undefined);
  const seen: string[] = [];
  page.on('INSTALLED', async () => {
    await Promise.reject(error);
  });
  page.on('INSTALLED', (id) => {
    seen.push(`installed:${id}`);
  });
  page.on('UNINSTALLED', (id) => {
    seen.push(`removed:${id}`);
  });
  emit('INSTALLED', 'extension');
  emit('UNINSTALLED', 'extension');
  await poll();
  expect(seen).toEqual(['installed:extension', 'removed:extension']);
  expect(log).toHaveBeenCalledWith('Error in INSTALLED callback:', error);
});

test('does not poll overlapping batches while a listener is pending', async () => {
  const seen: string[] = [];
  let finish: (() => void) | undefined;
  const manifest = new Promise<void>((resolve) => {
    finish = resolve;
  });
  page.on('INSTALLED', async (id) => {
    await manifest;
    seen.push(id);
  });
  emit('INSTALLED', 'first');
  await poll();
  emit('INSTALLED', 'second');
  expect(polls).toHaveLength(0);
  finish?.();
  await settle();
  expect(seen).toEqual(['first']);
  await poll();
  expect(seen).toEqual(['first', 'second']);
});
