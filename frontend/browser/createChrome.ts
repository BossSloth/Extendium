/* eslint-disable @typescript-eslint/no-empty-function */
import { ChromeEvent } from '../extension/ChromeEvent';
import { Extension } from '../extension/Extension';
import { Logger } from '../extension/Logger';
import { Storage } from '../extension/Storage';
import { queryTabs } from '../TabManager';
import { createOffscreen, createOptionsWindow } from '../windowManagement';

const VERBOSE = true;

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension, deps?: { createOffscreen: typeof createOffscreen; }): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  const localStorage = new Storage(extension, 'local', logger);
  const syncStorage = new Storage(extension, 'sync', logger);
  const sessionStorage = new Storage(extension, 'session', logger);

  return {
    i18n: extension.locale,
    storage: {
      local: localStorage,
      sync: syncStorage,
      session: sessionStorage,
      onChanged: extension.storageOnChanged,
    },
    runtime: {
      // @ts-expect-error Ignore
      sendMessage: async (message: unknown, callback: (response: unknown) => void): Promise<unknown> => {
        logger.log('runtime.sendMessage', message, callback);

        return extension.runtimeEmulator.sendMessage(context, message, callback);
      },
      onMessage: extension.runtimeEmulator.onMessage,
      setUninstallURL: (): void => {},
      getURL: (path: string): string => extension.getFileUrl(path) ?? '',
      getManifest: (): chrome.runtime.Manifest => extension.manifest,
      getContexts: extension.contexts.getContexts.bind(extension.contexts),
      openOptionsPage: async (): Promise<void> => {
        createOptionsWindow(extension);

        return Promise.resolve();
      },

      // TODO: implement
      onStartup: new ChromeEvent(),
      onInstalled: new ChromeEvent<() => void>(),
      id: '1234',
    },
    tabs: {
      // query: (): void => {},
      create: async (properties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
        logger.log('tabs.create', properties);

        SteamClient.System.OpenInSystemBrowser(properties.url ?? '');

        return Promise.resolve({});
      },
      // TODO: implement
      onRemoved: new ChromeEvent<(tabId: number) => void>(),
      onUpdated: new ChromeEvent<(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void>(),
      query: queryTabs,
    },
    offscreen: {
      createDocument: async (parameters: chrome.offscreen.CreateParameters): Promise<void> => {
        logger.log('offscreen.createDocument', parameters);

        await deps?.createOffscreen(extension, parameters.url, parameters.url);
      },
    },
    windows: {
      getAll: async (): Promise<chrome.windows.Window[]> => {
        logger.log('windows.getAll');

        return Promise.resolve([]);
      },
    },
    action: {
      onClicked: extension.action.onClicked,
      setBadgeText: (): void => {},
      setIcon: extension.action.setIcon.bind(extension.action),
      setBadgeBackgroundColor: (): void => {},
    },
    alarms: {
      onAlarm: new ChromeEvent<(alarm: chrome.alarms.Alarm) => void>(),
      create: async (...args: unknown[]): Promise<void> => {
        console.error('alarms.create not implemented', args);

        return Promise.resolve();
      },
    },
    permissions: {
      onAdded: new ChromeEvent<(permissions: chrome.permissions.Permissions) => void>(),
      onRemoved: new ChromeEvent<(permissions: chrome.permissions.Permissions) => void>(),
      contains: async (_permissions, callback?: (result: boolean) => void): Promise<boolean> => {
        callback?.(true);

        return Promise.resolve(true);
      },
    },
    extension: {
      isAllowedFileSchemeAccess: async (callback?: (result: boolean) => void): Promise<boolean> => {
        callback?.(false);

        return Promise.resolve(false);
      },
    },
    contextMenus: {
      // TODO: implement contextMenus
      onClicked: {
        addListener: () => {},
        hasListener: () => false,
        removeListener: () => {},
        hasListeners: () => false,
      },
    },
  };
}
