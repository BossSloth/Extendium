/* eslint-disable no-underscore-dangle */
import { ChromeDevToolsProtocol } from '@steambrew/client';
import { useExtensionsStore } from 'stores/extensionsStore';
import {
  createTarget,
  JsonSerializable,
  RuntimeEvaluate,
  Serializable,
  waitForDomReadyInTarget,
} from './ChromePageManager';
import { ExtensionInfo } from './types';

export async function getExtensions(): Promise<ExtensionInfo[]> {
  return persistentExtensionsPage.evaluateExpression(async () => {
    return chrome.developerPrivate.getExtensionsInfo({ includeDisabled: true });
  });
}

export async function getExtensionManifest(id: string): Promise<chrome.runtime.ManifestV3> {
  return JSON.parse(await getExtensionFileContent(id, 'manifest.json')) as chrome.runtime.ManifestV3;
}

export async function getExtensionFileContent(id: string, filePath: string): Promise<string> {
  return persistentExtensionsPage.evaluateExpression(
    async (_id: string, _filePath: string) => {
      const response = await chrome.developerPrivate.requestFileSource({
        extensionId: _id,
        pathSuffix: _filePath,
        message: '',
        manifestKey: 'Invalid!',
      });

      return response.beforeHighlight + response.highlight + response.afterHighlight;
    },
    [id, filePath],
  );
}

export async function uninstallExtension(id: string): Promise<void> {
  await persistentExtensionsPage.evaluateExpression(
    async (_id: string) => chrome.management.uninstall(_id), //
    [id],
  );
  useExtensionsStore.getState().removeExtension(id);
}

declare global {
  interface Window {
    __extendiumOnInstalledQueue?: chrome.developerPrivate.EventData[];
  }
}

const trackedEvents: `${chrome.developerPrivate.EventType}`[] = ['INSTALLED', 'UNINSTALLED', 'UNLOADED', 'LOADED'];

type TrackedEvent = (typeof trackedEvents)[number];

type ExtensionEventCallback = (id: string, info?: chrome.developerPrivate.ExtensionInfo) => void | Promise<void>;

class PersistentExtensionsPage {
  private sessionId: string | null = null;
  private readonly eventCallbacks = new Map<TrackedEvent, Set<ExtensionEventCallback>>();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.sessionId = await createTarget('chrome://extensions', false);

    await this.setupEventListener();

    await waitForDomReadyInTarget(this.sessionId);

    await RuntimeEvaluate(
      this.sessionId,
      () => {
        document.title = 'Extendium Extensions Manager';
      },
      [],
    );
  }

  private async setupEventListener(): Promise<void> {
    if (this.sessionId === null) {
      throw new Error('Session not initialized');
    }

    await RuntimeEvaluate(
      this.sessionId,
      (_trackedEvents: readonly string[]) => {
        window.__extendiumOnInstalledQueue ??= [];
        chrome.developerPrivate.onItemStateChanged.addListener((info) => {
          if (_trackedEvents.includes(info.event_type)) {
            window.__extendiumOnInstalledQueue?.push(info);
          }
        });
      },
      [trackedEvents],
    );

    this.isInitialized = true;

    this.startPollingForEvents();
  }

  private startPollingForEvents(): void {
    const pollInterval = 5000;

    const poll = async (): Promise<void> => {
      if (this.sessionId === null || !this.isInitialized) {
        return;
      }

      try {
        const extensionEvents = await RuntimeEvaluate(
          this.sessionId, //
          () => {
            return window.__extendiumOnInstalledQueue?.splice(0);
          },
        );
        if (extensionEvents) {
          for (const event of extensionEvents) {
            if (PersistentExtensionsPage.isTrackedEvent(event.event_type)) {
              // eslint-disable-next-line no-await-in-loop -- Finish each state change before dispatching the next event.
              await this.handleEvent(event.event_type, event.extensionInfo ?? event.item_id);
            }
          }
        }
      } catch (error) {
        console.error('Error polling for extension events:', error);
      }

      setTimeout(() => {
        poll().catch(() => {
          return undefined;
        });
      }, pollInterval);
    };

    poll().catch(() => {
      return undefined;
    });
  }

  private static isTrackedEvent(event: string): event is TrackedEvent {
    return trackedEvents.includes(event as TrackedEvent);
  }

  private async handleEvent(
    eventType: TrackedEvent,
    extensionInfo: chrome.developerPrivate.ExtensionInfo | string,
  ): Promise<void> {
    if (this.sessionId === null) {
      return;
    }

    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks === undefined) {
      return;
    }

    for (const callback of callbacks) {
      try {
        // eslint-disable-next-line no-await-in-loop -- Wait for async listeners and catch their rejections here.
        await callback(
          typeof extensionInfo === 'string' ? extensionInfo : extensionInfo.id,
          typeof extensionInfo === 'string' ? undefined : extensionInfo,
        );
      } catch (error) {
        console.error(`Error in ${eventType} callback:`, error);
      }
    }
  }

  on(event: TrackedEvent, callback: ExtensionEventCallback): () => void {
    let callbacks = this.eventCallbacks.get(event);
    if (callbacks === undefined) {
      callbacks = new Set();
      this.eventCallbacks.set(event, callbacks);
    }

    callbacks.add(callback);

    return () => {
      this.eventCallbacks.get(event)?.delete(callback);
    };
  }

  public async evaluateExpression<T extends JsonSerializable, TArgs extends readonly JsonSerializable[] = []>(
    expression: (...args: TArgs) => Serializable<T> | Promise<Serializable<T>>,
    args?: TArgs,
  ): Promise<T> {
    if (this.sessionId === null) {
      throw new Error('Session not initialized');
    }

    return RuntimeEvaluate(this.sessionId, expression, args);
  }

  async destroy(): Promise<void> {
    if (this.sessionId !== null) {
      await ChromeDevToolsProtocol.send('Page.close', undefined, this.sessionId);
      this.sessionId = null;
    }
    this.eventCallbacks.clear();
    this.isInitialized = false;
  }
}

export const persistentExtensionsPage = new PersistentExtensionsPage();
