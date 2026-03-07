import { ChromeDevToolsProtocol } from '@steambrew/client';
import { mainWindow, uniqueId } from 'shared';

export type JsonPrimitive = string | number | boolean | null | undefined | void;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-explicit-any
type NonSerializable = Function | Map<any, any> | Set<unknown> | WeakMap<object, unknown> | WeakSet<object> | Date | RegExp | Error;

export type ExcludeNonSerializable<T> = Exclude<T, NonSerializable>;

export type JsonSerializable = JsonPrimitive | unknown[] | object | readonly unknown[];

export type Serializable<T> = T extends NonSerializable ? never : T;

export async function waitForDomReadyInTarget(sessionId: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();

  await new Promise<void>((resolve, reject) => {
    async function tick(): Promise<void> {
      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Timed out waiting for DOM ready'));

        return;
      }

      const res = await ChromeDevToolsProtocol.send('Runtime.evaluate', {
        expression: '({ readyState: document.readyState, hasBody: document.body !== null })',
        returnByValue: true,
        awaitPromise: true,
      }, sessionId);

      const value = res.result.value as { readyState?: string; hasBody?: boolean; } | undefined;
      const hasBody = value?.hasBody === true;
      const ready = value?.readyState === 'interactive' || value?.readyState === 'complete';

      if (hasBody && ready) {
        setTimeout(() => {
          resolve();
        }, 100);

        return;
      }

      setTimeout(() => {
        tick().catch(() => {
          return undefined;
        });
      }, 50);
    }

    tick().catch(() => {
      return undefined;
    });
  });
}

export async function createTarget(url: string, waitForDom: boolean): Promise<string> {
  const randomId = uniqueId();

  createHiddenWindow(randomId);

  const targets = await ChromeDevToolsProtocol.send('Target.getTargets');
  const target = targets.targetInfos.find(tr => tr.title === randomId);
  if (target === undefined) {
    throw new Error('Failed to find target');
  }

  const sessionId = (await ChromeDevToolsProtocol.send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true,
  })).sessionId;

  // Navigate to the URL
  await ChromeDevToolsProtocol.send('Page.navigate', {
    url,
  }, sessionId);

  if (waitForDom) {
    await waitForDomReadyInTarget(sessionId);
  }

  return sessionId;
}

function createHiddenWindow(randomId: string): void {
  const popup = SteamClient.BrowserView.CreatePopup({
    parentPopupBrowserID: mainWindow.SteamClient.Browser.GetBrowserID(),
  });
  const popupWindow = window.open(popup.strCreateURL);

  if (!popupWindow) {
    throw new Error('Failed to open popup');
  }

  popupWindow.document.title = randomId;
}

export async function RuntimeEvaluate<T extends JsonSerializable, TArgs extends readonly JsonSerializable[] = []>(
  sessionId: string,
  expression: (...args: TArgs) => Serializable<T> | Promise<Serializable<T>>,
  args?: TArgs,
): Promise<T> {
  let expressionString: string;

  if (typeof expression === 'function') {
    const serializedArgs = args ? args.map(arg => JSON.stringify(arg)).join(', ') : '';
    expressionString = `(${expression.toString()})(${serializedArgs})`;
  } else {
    expressionString = expression;
  }

  const response = await ChromeDevToolsProtocol.send('Runtime.evaluate', {
    expression: expressionString,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  }, sessionId);

  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? 'Unknown error');
  }

  return response.result.value as T;
}

export async function evaluateExpression<T extends JsonSerializable, TArgs extends readonly JsonSerializable[] = []>(
  expression: (...args: TArgs) => Serializable<T> | Promise<Serializable<T>>,
  url: string,
  waitForDom = false,
  args?: TArgs,
): Promise<T> {
  const sessionId = await createTarget(url, waitForDom);

  const result = await RuntimeEvaluate(sessionId, expression, args);

  // We don't await the close as we don't care about it for the response
  ChromeDevToolsProtocol.send('Page.close', undefined, sessionId);

  return result;
}

export function OpenTargetPage(url: string): void {
  ChromeDevToolsProtocol.send('Target.createTarget', {
    url,
    focus: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).evaluateExpression = evaluateExpression;
