/* eslint-disable @typescript-eslint/no-empty-function */
import { Extension } from '../extension/Extension';
import { Logger } from '../extension/Logger';
import { Storage } from '../extension/Storage';
import { createOffscreen } from '../windowManagement';

const VERBOSE = true;

// Note we use dependency injection to prevent circular dependencies
export function createChrome(context: string, extension: Extension, deps: { createOffscreen: typeof createOffscreen; }): typeof window.chrome {
  const logger = new Logger(extension, VERBOSE, context);

  const localStorage = new Storage(extension, 'local', logger);

  return {
    i18n: extension.locale,
    storage: {
      local: localStorage,
    },
    runtime: {
      // @ts-expect-error Ignore
      sendMessage: async (...args): Promise<unknown> => {
        logger.log('runtime.sendMessage', ...args);

        return extension.runtimeEmulator.sendMessage(context, ...args);
      },
      // @ts-expect-error Ignore
      onMessage: {
        addListener: (...args): void => { extension.runtimeEmulator.onMessage.addListener(context, ...args); },
        // @ts-expect-error Ignore
        removeListener: (...args): void => { extension.runtimeEmulator.onMessage.removeListener(context, ...args); },
        hasListeners: (): boolean => { return extension.runtimeEmulator.onMessage.hasListeners(); },
        hasListener: (...args): boolean => { return extension.runtimeEmulator.onMessage.hasListener(context, ...args); },
      },
      onInstalled: {
        addListener: () => {},
      },
      getURL: (path: string): string => extension.getFileUrl(path) ?? '',
      getManifest: (): chrome.runtime.Manifest => extension.manifest,
      getContexts: extension.contexts.getContexts.bind(extension.contexts),
    },
    tabs: {
      query: (): void => {},
      create: async (properties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
        logger.log('tabs.create', properties);

        SteamClient.System.OpenInSystemBrowser(properties.url ?? '');

        return Promise.resolve({});
      },
    },
    offscreen: {
      createDocument: async (parameters: chrome.offscreen.CreateParameters): Promise<void> => {
        logger.log('offscreen.createDocument', parameters);

        await deps.createOffscreen(extension, `${extension.manifest.name} - ${parameters.url}`, parameters.url);
      },
    },
    windows: {
      getAll: async (): Promise<chrome.windows.Window[]> => {
        logger.log('windows.getAll');

        return Promise.resolve([]);
      },
    },
    action: {
      setBadgeText: (): void => {},
      setIcon: (): void => {},
      setBadgeBackgroundColor: (): void => {},
    },
  };
}
