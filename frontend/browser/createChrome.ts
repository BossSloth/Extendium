/* eslint-disable @typescript-eslint/no-empty-function */
import { ChromeEvent } from '../extension/ChromeEvent';
import { Extension } from '../extension/Extension';
import { Logger } from '../extension/Logger';
import { Storage, SyncStorage } from '../extension/Storage';
import { queryTabs } from '../TabManager';
import { closeOffscreen, createOffscreen, createOptionsWindow } from '../windowManagement';

const VERBOSE = true;

let chromeObj: typeof window.chrome;

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  chromeObj = {
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
    commands: createCommandsType(extension, logger),
  };

  return chromeObj;
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/runtime
 */
function createRuntimeType(extension: Extension, logger: Logger): typeof chrome.runtime {
  return {
    // @ts-expect-error Ignore
    sendMessage: async (message: unknown, callback?: (response: unknown) => void): Promise<unknown> => {
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
    connect: (arg1?: chrome.runtime.ConnectInfo | string, arg2?: chrome.runtime.ConnectInfo): chrome.runtime.Port => {
      let extensionId: string | undefined;
      let connectInfo: chrome.runtime.ConnectInfo;
      if (arg2 !== undefined) {
        extensionId = arg1 as string;
        connectInfo = arg2;
      } else {
        connectInfo = arg1 as chrome.runtime.ConnectInfo;
      }

      logger.log('runtime.connect', connectInfo, extensionId);

      const onDisconnectEvent = new ChromeEvent<(port: chrome.runtime.Port) => void>();
      const onMessageEvent = new ChromeEvent<(message: unknown, port: chrome.runtime.Port) => void>();

      const port: chrome.runtime.Port = {
        postMessage: (message: unknown): void => {
          chromeObj.runtime.sendMessage(message).then((response) => {
            onMessageEvent.emit(response, port);
          });
        },
        disconnect: (): void => {
          onDisconnectEvent.emit(port);
        },
        onDisconnect: onDisconnectEvent,
        onMessage: onMessageEvent,
        name: 'test',
      };

      return port;
    },
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/storage
 */
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

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/offscreen
 */
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

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/action
 */
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

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/tabs
 */
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
    onActivated: new ChromeEvent<(activeInfo: chrome.tabs.TabActiveInfo) => void>(),
    query: queryTabs,
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/windows
 */
function createWindowsType(extension: Extension, logger: Logger): typeof chrome.windows {
  // TODO: implement
  return {
    getAll: async (): Promise<chrome.windows.Window[]> => {
      logger.log('windows.getAll');

      return Promise.resolve([]);
    },
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/alarms
 */
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
    getAll: async (): Promise<chrome.alarms.Alarm[]> => {
      return Promise.resolve([]);
    },
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/permissions
 */
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

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/extension
 */
function createExtensionType(extension: Extension, logger: Logger): typeof chrome.extension {
  // TODO: implement
  return {
    isAllowedFileSchemeAccess: async (callback?: (result: boolean) => void): Promise<boolean> => {
      callback?.(false);

      return Promise.resolve(false);
    },
    isAllowedIncognitoAccess: async (callback?: (result: boolean) => void): Promise<boolean> => {
      callback?.(false);

      return Promise.resolve(false);
    },
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/contextMenus
 */
function createContextMenusType(extension: Extension, logger: Logger): typeof chrome.contextMenus {
  // TODO: implement
  return {
    create: (...args: unknown[]): string | number => {
      console.error('contextMenus.create not implemented', args);

      return -1;
    },
    onClicked: new ChromeEvent<(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void>(),
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/commands
 */
function createCommandsType(extension: Extension, logger: Logger): typeof chrome.commands {
  // TODO: implement
  return {
    onCommand: new ChromeEvent<(command: string) => void>(),
    getAll: async (): Promise<chrome.commands.Command[]> => {
      logger.log('commands.getAll');

      return Promise.resolve([]);
    },
  };
}
