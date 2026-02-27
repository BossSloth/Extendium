/* eslint-disable no-underscore-dangle */
import { ChromeDevToolsProtocol } from '@steambrew/client';
import { createTarget, RuntimeEvaluate, waitForDomReadyInTarget } from './ChromePageManager';
import { ExtensionInfo } from './types';

export async function getExtensions(): Promise<ExtensionInfo[]> {
  return persistentExtensionsPage.evaluateExpression(async () => chrome.developerPrivate.getExtensionsInfo({ includeDisabled: true }));
}

export type JsonPrimitive = string | number | boolean | null | undefined | void;

export type JsonSerializable = JsonPrimitive | Record<string, unknown> | unknown[] | readonly unknown[];

declare global {
  interface Window {
    __extendiumOnInstalledQueue?: Map<TrackedEvent, (ExtensionInfo | string)[]>;
  }
}

const trackedEvents: `${chrome.developerPrivate.EventType}`[] = ['INSTALLED', 'UNINSTALLED'];

type TrackedEvent = typeof trackedEvents[number];

type ExtensionEventCallback = (id: string, info?: chrome.developerPrivate.ExtensionInfo) => void;

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

    await RuntimeEvaluate(this.sessionId, () => {
      document.title = 'Extendium Extensions Manager';
    }, []);
  }

  private async setupEventListener(): Promise<void> {
    if (this.sessionId === null) {
      throw new Error('Session not initialized');
    }

    await RuntimeEvaluate(this.sessionId, (_trackedEvents: readonly string[]) => {
      window.__extendiumOnInstalledQueue ??= new Map();
      chrome.developerPrivate.onItemStateChanged.addListener((info) => {
        if (_trackedEvents.includes(info.event_type)) {
          const current = window.__extendiumOnInstalledQueue?.get(info.event_type as TrackedEvent) ?? [];
          current.push(info.extensionInfo ?? info.item_id);
          window.__extendiumOnInstalledQueue?.set(info.event_type as TrackedEvent, current);
        }
      });
    }, [trackedEvents]);

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
          this.sessionId,
          () => (window.__extendiumOnInstalledQueue ? Object.fromEntries(window.__extendiumOnInstalledQueue) : undefined),
        );
        if (extensionEvents) {
          Object.entries(extensionEvents).forEach(([eventType, extensionInfos]) => {
            if (PersistentExtensionsPage.isTrackedEvent(eventType)) {
              (extensionInfos).forEach((extensionInfo) => {
                this.handleEvent(eventType, extensionInfo);
              });
            }
          });
          await RuntimeEvaluate(this.sessionId, () => {
            window.__extendiumOnInstalledQueue?.clear();
          });
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

  private handleEvent(eventType: TrackedEvent, extensionInfo: ExtensionInfo | string): void {
    if (this.sessionId === null) {
      return;
    }

    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks === undefined) {
      return;
    }

    callbacks.forEach((callback) => {
      try {
        callback(
          typeof extensionInfo === 'string' ? extensionInfo : extensionInfo.id,
          typeof extensionInfo === 'string' ? undefined : extensionInfo,
        );
      } catch (error) {
        console.error(`Error in ${eventType} callback:`, error);
      }
    });
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

  public async evaluateExpression<T extends JsonSerializable = JsonSerializable, TArgs extends readonly JsonSerializable[] = []>(
    expression: (...args: TArgs) => T | Promise<T>,
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
