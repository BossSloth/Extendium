/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ChromeEvent } from '@extension/ChromeEvent';
import { OnInstalledReason } from '@extension/Enums';
import { Extension } from '@extension/Extension';
import { Logger } from '@extension/Logger';
import { parseRuntimeSendMessageArgs } from '@extension/Messaging';
import { Storage, SyncStorage } from '@extension/Storage';
import { createTab, queryTabs } from '../TabManager';
import { closeOffscreen, createOffscreen, createOptionsWindow } from '../windowManagement';
import { createSafeProxy } from './safeProxy';

const VERBOSE = true;

let chromeObj: typeof window.chrome;

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension, senderUrl?: string): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  const baseChromeObj: typeof window.chrome = {
    i18n: extension.locale,
    storage: createStorageType(extension, logger),
    runtime: createRuntimeType(extension, logger, senderUrl),
    tabs: createTabsType(extension, logger),
    offscreen: createOffscreenType(extension, logger),
    windows: createWindowsType(extension, logger),
    action: createActionType(extension, logger),
    alarms: createAlarmsType(extension, logger),
    permissions: createPermissionsType(extension, logger),
    extension: createExtensionType(extension, logger),
    contextMenus: createContextMenusType(extension, logger),
    commands: createCommandsType(extension, logger),
    notifications: createNotificationsType(extension, logger),
    webRequest: createWebRequestType(extension, logger),
    declarativeNetRequest: createDeclarativeNetRequestType(extension, logger),
    management: createManagementType(extension, logger),
  };

  chromeObj = createSafeProxy(baseChromeObj, logger) as typeof window.chrome;

  return chromeObj;
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/runtime
 */
function createRuntimeType(extension: Extension, logger: Logger, senderUrl?: string): typeof chrome.runtime {
  return {
    sendMessage: async (...args: unknown[]): Promise<unknown> => {
      const parsedArgs = parseRuntimeSendMessageArgs(args);

      if (parsedArgs.options !== undefined) {
        logger.error('runtime.sendMessage', 'runtime.sendMessage with options is not supported yet, options:', parsedArgs.options);
      }

      if (parsedArgs.extensionId !== undefined && parsedArgs.extensionId !== '1234') {
        logger.error('runtime.sendMessage', 'runtime.sendMessage with extensionId other then our own is not supported yet, extensionId:', parsedArgs.extensionId);
      }

      logger.log('runtime.sendMessage', parsedArgs);

      return extension.runtimeEmulator.sendMessage(parsedArgs.message, parsedArgs.callback, senderUrl);
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
    onInstalled: extension.onInstalled,
    OnInstalledReason,
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
    onConnect: new ChromeEvent<(port: chrome.runtime.Port) => void>(),
    onConnectExternal: new ChromeEvent<(port: chrome.runtime.Port) => void>(),
    onUpdateAvailable: new ChromeEvent<(details: chrome.runtime.UpdateAvailableDetails) => void>(),
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
    onChanged: extension.onStorageChanged,
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
    setPopup: async (details: chrome.action.PopupDetails): Promise<void> => {
      logger.log('action.setPopup', details);

      return Promise.resolve();
    },
    setTitle: async (details: chrome.action.TitleDetails): Promise<void> => {
      logger.log('action.setTitle', details);

      extension.action.setTitle(details.title);

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

      createTab(properties);

      return Promise.resolve({});
    },
    onRemoved: new ChromeEvent<(tabId: number) => void>(),
    onUpdated: new ChromeEvent<(tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => void>(),
    onActivated: new ChromeEvent<(activeInfo: chrome.tabs.OnActivatedInfo) => void>(),
    query: queryTabs,
    detectLanguage: async (arg1?: number | ((language: string) => void), arg2?: (language: string) => void): Promise<string> => {
      logger.log('tabs.detectLanguage', arg1, arg2);

      let callback: ((language: string) => void) | undefined;
      if (typeof arg1 === 'function') {
        callback = arg1;
      } else if (typeof arg2 === 'function') {
        callback = arg2;
      }

      if (callback !== undefined) {
        callback(extension.locale.getUILanguage());
      }

      return Promise.resolve(extension.locale.getUILanguage());
    },
    sendMessage: async (...args: unknown[]): Promise<void> => {
      logger.error('tabs.sendMessage', 'tabs.sendMessage not implemented', args);

      return Promise.resolve();
    },
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
    onBoundsChanged: new ChromeEvent<(window: chrome.windows.Window) => void>(),
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
      logger.error('alarms.create', 'alarms.create not implemented', args);

      return Promise.resolve();
    },
    get: async (): Promise<chrome.alarms.Alarm> => {
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
      logger.error('contextMenus.create', 'contextMenus.create not implemented', args);

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
    getAll: async (callback?: (commands: chrome.commands.Command[]) => void): Promise<chrome.commands.Command[]> => {
      logger.log('commands.getAll', callback);

      callback?.([]);

      return Promise.resolve([]);
    },
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/notifications
 */
function createNotificationsType(extension: Extension, logger: Logger): typeof chrome.notifications {
  // TODO: implement
  return {
    create: (...args: unknown[]): string | number => {
      logger.error('notifications.create', 'notifications.create not implemented', args);

      return -1;
    },
    onClosed: new ChromeEvent<(notificationId: string) => void>(),
    onButtonClicked: new ChromeEvent<(notificationId: string) => void>(),
    onClicked: new ChromeEvent<(notificationId: string) => void>(),
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/webRequest
 */
function createWebRequestType(extension: Extension, logger: Logger): typeof chrome.webRequest {
  // TODO: implement
  return {
    onBeforeRequest: new ChromeEvent<(details: chrome.webRequest.WebRequestDetails) => void>(),
    onBeforeSendHeaders: new ChromeEvent<(details: chrome.webRequest.WebRequestDetails) => void>(),
    onHeadersReceived: new ChromeEvent<(details: chrome.webRequest.WebRequestDetails) => void>(),
    onCompleted: new ChromeEvent<(details: chrome.webRequest.WebRequestDetails) => void>(),
    onErrorOccurred: new ChromeEvent<(details: chrome.webRequest.WebRequestDetails) => void>(),
  };
}

/**
 * @see https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest
 */
function createDeclarativeNetRequestType(extension: Extension, logger: Logger): typeof chrome.declarativeNetRequest {
  // TODO: implement
  return {
    getDynamicRules: async (callback?: (rules: chrome.declarativeNetRequest.Rule[]) => void): Promise<chrome.declarativeNetRequest.Rule[]> => {
      logger.log('declarativeNetRequest.getDynamicRules');

      callback?.([]);

      return Promise.resolve([]);
    },
    updateDynamicRules: async (_options: chrome.declarativeNetRequest.UpdateRuleOptions, callback?: Function): Promise<void> => {
      logger.log('declarativeNetRequest.updateDynamicRules');

      callback?.();

      return Promise.resolve();
    },
  };
}

function createManagementType(extension: Extension, logger: Logger): typeof chrome.management {
  // TODO: implement
  return {
    getSelf: async (callback?: (info: chrome.management.ExtensionInfo) => void): Promise<chrome.management.ExtensionInfo> => {
      logger.log('management.getSelf');

      callback?.({});

      return Promise.resolve({});
    },
  };
}
