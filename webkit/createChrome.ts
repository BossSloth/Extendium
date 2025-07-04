import { ChromeEvent } from './extension/ChromeEvent';
import { Extension } from './extension/Extension';
import { Logger } from './extension/Logger';
import { WebkitRequestType } from './extension/websocket/MessageTypes';
import { webSocketClient } from './shared';
import { WebkitStorage } from './webkit-extension/WebkitStorage';

const VERBOSE = true;

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  const extensionName = extension.getName();

  const syncStorage = new WebkitStorage(extensionName, 'sync');
  const localStorage = new WebkitStorage(extensionName, 'local');

  async function sendMessageNormal(message: unknown, responseCallback?: (response?: unknown) => void): Promise<unknown> {
    logger.log('runtime.sendMessage', message);

    try {
      const response = await webSocketClient.sendMessage(message, WebkitRequestType.SendMessage, extensionName);

      if (responseCallback) {
        responseCallback(response);
      }

      return response;
    } catch (error) {
      logger.log('Error in runtime.sendMessage:', error);
      throw error;
    }
  }

  async function sendMessageWithExtensionId(_extensionId: string, message: unknown, responseCallback?: (response?: unknown) => void): Promise<unknown> {
    return sendMessageNormal(message, responseCallback);
  }

  return {
    i18n: extension.locale,
    runtime: {
      sendMessage: async (arg1: unknown, arg2?: unknown, arg3?: unknown): Promise<unknown> => {
        if (arg3 !== undefined) {
          return sendMessageWithExtensionId(arg1 as string, arg2, arg3 as (response?: unknown) => void);
        }

        return sendMessageNormal(arg1, arg2 as (response?: unknown) => void);
      },
      id: '1234',
      onMessage: new ChromeEvent<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void>(),
      getURL: (path: string): string => extension.getFileUrl(path) ?? '',
      getManifest: (): chrome.runtime.Manifest => extension.manifest,
    },
    storage: {
      sync: syncStorage,
      local: localStorage,
      // TODO: implement
      onChanged: new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>(),
    },
  };
}
