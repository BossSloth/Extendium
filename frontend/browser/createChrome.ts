/* eslint-disable @typescript-eslint/no-empty-function */
import { ChromeEvent } from '../extension/ChromeEvent';
import { Extension } from '../extension/Extension';
import { Logger } from '../extension/Logger';
import { Storage, SyncStorage } from '../extension/Storage';
import { queryTabs } from '../TabManager';
import { closeOffscreen, createOffscreen, createOptionsWindow } from '../windowManagement';

const VERBOSE = true;

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  return {
    i18n: extension.locale,
    storage: createStorageType(extension, logger),
    runtime: createRuntimeType(extension, logger),
    tabs: createTabsType(extension, logger),
    offscreen: createOffscreenType(extension, logger),
    windows: createWindowsType(extension, logger),
    action: createActionType(extension, logger),
    alarms: createAlarmsType(extension, logger),
    permissions: createPermissionsType(extension, logger),
    extension: createExtensionType(extension, logger),
    contextMenus: createContextMenusType(extension, logger),
  };
}

function createRuntimeType(extension: Extension, logger: Logger): typeof chrome.runtime {
  return {
    // @ts-expect-error Ignore
    sendMessage: async (message: unknown, callback: (response: unknown) => void): Promise<unknown> => {
      logger.log('runtime.sendMessage', message, callback);

      return extension.runtimeEmulator.sendMessage(message, callback);
    },
    onMessage: extension.runtimeEmulator.onMessage,
    onMessageExternal: extension.runtimeEmulator.onMessage,
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
  };
}

function createStorageType(extension: Extension, logger: Logger): typeof chrome.storage {
  return {
    local: new Storage(extension, 'local', logger),
    sync: new SyncStorage(extension, logger),
    session: new Storage(extension, 'session', logger),
    onChanged: extension.storageOnChanged,
    managed: new Storage(extension, 'managed', logger),
    // @ts-expect-error ignore AccessLevel
    AccessLevel: null,
  };
}

function createOffscreenType(extension: Extension, logger: Logger): typeof chrome.offscreen {
  return {
    createDocument: async (parameters: chrome.offscreen.CreateParameters): Promise<void> => {
      logger.log('offscreen.createDocument', parameters);

      await createOffscreen(extension, parameters.url, parameters.url);
    },
    closeDocument: async (): Promise<void> => {
      logger.log('offscreen.closeDocument');

      await closeOffscreen(extension);
    },
    /** @ts-expect-error Reason enum is not implemented */
    Reason: null,
    hasDocument: async (): Promise<boolean> => {
      logger.log('offscreen.hasDocument');

      return Promise.resolve(false);
    },
  };
}

function createActionType(extension: Extension, logger: Logger): typeof chrome.action {
  // TODO: implement
  return {
    onClicked: extension.action.onClicked,
    setBadgeText: async (_details: chrome.action.BadgeTextDetails): Promise<void> => {
      logger.log('action.setBadgeText', _details);

      return Promise.resolve();
    },
    setIcon: extension.action.setIcon.bind(extension.action),
    setBadgeBackgroundColor: async (_details: chrome.action.BadgeColorDetails): Promise<void> => {
      logger.log('action.setBadgeBackgroundColor', _details);

      return Promise.resolve();
    },
  };
}

function createTabsType(extension: Extension, logger: Logger): typeof chrome.tabs {
  // TODO: implement
  return {
    create: async (properties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
      logger.log('tabs.create', properties);

      SteamClient.System.OpenInSystemBrowser(properties.url ?? '');

      return Promise.resolve({});
    },
    onRemoved: new ChromeEvent<(tabId: number) => void>(),
    onUpdated: new ChromeEvent<(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void>(),
    query: queryTabs,
  };
}

function createWindowsType(extension: Extension, logger: Logger): typeof chrome.windows {
  // TODO: implement
  return {
    getAll: async (): Promise<chrome.windows.Window[]> => {
      logger.log('windows.getAll');

      return Promise.resolve([]);
    },
  };
}

function createAlarmsType(extension: Extension, logger: Logger): typeof chrome.alarms {
  // TODO: implement
  return {
    onAlarm: new ChromeEvent<(alarm: chrome.alarms.Alarm) => void>(),
    create: async (...args: unknown[]): Promise<void> => {
      console.error('alarms.create not implemented', args);

      return Promise.resolve();
    },
    get: async (..._args: unknown[]): Promise<chrome.alarms.Alarm> => {
      return Promise.resolve({} as chrome.alarms.Alarm);
    },
  };
}

function createPermissionsType(extension: Extension, logger: Logger): typeof chrome.permissions {
  // TODO: implement
  return {
    onAdded: new ChromeEvent<(permissions: chrome.permissions.Permissions) => void>(),
    onRemoved: new ChromeEvent<(permissions: chrome.permissions.Permissions) => void>(),
    contains: async (_permissions, callback?: (result: boolean) => void): Promise<boolean> => {
      callback?.(true);

      return Promise.resolve(true);
    },
  };
}

function createExtensionType(extension: Extension, logger: Logger): typeof chrome.extension {
  // TODO: implement
  return {
    isAllowedFileSchemeAccess: async (callback?: (result: boolean) => void): Promise<boolean> => {
      callback?.(false);

      return Promise.resolve(false);
    },
  };
}

function createContextMenusType(extension: Extension, logger: Logger): typeof chrome.contextMenus {
  // TODO: implement
  return {
    onClicked: {
      addListener: () => {},
      hasListener: () => false,
      removeListener: () => {},
      hasListeners: () => false,
    },
  };
}
