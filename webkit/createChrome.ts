import { callable } from '@steambrew/webkit';
import { ChromeEvent } from './extension/ChromeEvent';
import { Extension } from './extension/Extension';
import { Logger } from './extension/Logger';
import { base64Decode, base64Encode } from './utils';

const VERBOSE = true;

const sendMessage = callable<[{ extensionName: string; content: string; }], string>('Webkit.SendMessage');

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  // const localStorage = new Storage(extension, 'local', logger);

  return {
    i18n: extension.locale,
    // storage: {
    //   local: localStorage,
    // },
    runtime: {
      // TODO: response callback
      // @ts-expect-error Ignore
      sendMessage: async (message: unknown, responseCallback?: (response?: unknown) => void): Promise<unknown> => {
        logger.log('runtime.sendMessage', message);

        const responseStr = base64Decode(await sendMessage({ extensionName: extension.getName(), content: base64Encode(JSON.stringify(message)) }));
        const response = responseStr === 'undefined' ? undefined : JSON.parse(responseStr) as unknown;

        if (responseCallback) {
          responseCallback(response);
        }

        return response;
      },
      id: '1234',
      onMessage: new ChromeEvent<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void>(),
      getURL: (path: string): string => extension.getFileUrl(path) ?? '',
      getManifest: (): chrome.runtime.Manifest => extension.manifest,
    },
  };
}
