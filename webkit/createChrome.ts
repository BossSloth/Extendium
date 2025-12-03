import { ChromeEvent } from '@extension/ChromeEvent';
import { Extension } from '@extension/Extension';
import { createSafeProxy } from '@extension/helpers/safeProxy';
import { Logger } from '@extension/Logger';
import { parseRuntimeSendMessageArgs } from '@extension/Messaging';
import { WebkitRequestType } from '@extension/websocket/MessageTypes';
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
      logger.error('Error in runtime.sendMessage:', error);
      throw error;
    }
  }

  const baseChromeObj: typeof window.chrome = {
    i18n: extension.locale,
    runtime: {
      sendMessage: async (...args: unknown[]): Promise<unknown> => {
        const parsedArgs = parseRuntimeSendMessageArgs(args);

        if (parsedArgs.options !== undefined) {
          logger.error('runtime.sendMessage with options is not supported yet, options:', parsedArgs.options);
        }

        if (parsedArgs.extensionId !== undefined && parsedArgs.extensionId !== '1234') {
          logger.error('runtime.sendMessage with extensionId other then our own is not supported yet, extensionId:', parsedArgs.extensionId);
        }

        return sendMessageNormal(parsedArgs.message, parsedArgs.callback);
      },
      id: '1234',
      onMessage: new ChromeEvent<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void>(),
      getURL: (path: string): string => extension.getFileUrl(path) ?? '',
      getManifest: (): chrome.runtime.Manifest => extension.manifest,
      lastError: undefined,
    },
    storage: {
      sync: syncStorage,
      local: localStorage,
      // TODO: implement
      onChanged: new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>(),
    },
  };

  return createSafeProxy(baseChromeObj, logger) as typeof window.chrome;
}
