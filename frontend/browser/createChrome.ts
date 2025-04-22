/* eslint-disable @typescript-eslint/no-empty-function */
import { Extension } from '../extension/Extension';
import { Logger } from '../extension/Logger';
import { Storage } from '../extension/Storage';
import { createOffscreen } from '../windowManagement';

const VERBOSE = true;

// Note we use dependency injection to prevent circular dependencies
export async function createChrome(context: string, extension: Extension, deps: { createOffscreen: typeof createOffscreen; }): Promise<typeof window.chrome> {
  const localeMessages = await initLocale(extension);

  const logger = new Logger(extension, VERBOSE, context);

  const localStorage = new Storage(extension, 'local', logger);

  return {
    i18n: {
      getMessage: (messageKey: string, substitutions?: string[] | string): string => {
        if (typeof substitutions === 'string') {
          substitutions = [substitutions];
        }

        logger.log('i18n.getMessage', messageKey, substitutions);

        const record = localeMessages[messageKey];
        if (!record) {
          return messageKey;
        }

        if (!substitutions) {
          return record.message;
        }

        let message = record.message;

        const placeholders = record.placeholders;
        for (const [key, value] of Object.entries(placeholders)) {
          message = message.replace(`$${key.toUpperCase()}$`, value.content);
        }

        for (let i = 1; i <= substitutions.length; i++) {
          message = message.replace(`$${i}`, substitutions[i - 1] ?? '');
        }

        return message;
      },
      getUILanguage: (): string => navigator.language,
      getAcceptLanguages: async (): Promise<string[]> => Promise.resolve([navigator.language]),
      detectLanguage: async (): Promise<chrome.i18n.LanguageDetectionResult> => Promise.resolve({ language: navigator.language, isReliable: true, languages: [{ language: navigator.language, percentage: 100 }] }),
    },
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

interface LanguageRecord {
  message: string;
  placeholders: Record<string, { content: string; }>;
}

async function initLocale(extension: Extension): Promise<Record<string, LanguageRecord>> {
  const language = navigator.language.split('-')[0];
  const content = await fetch(extension.getFileUrl(`/_locales/${language}/messages.json`) ?? '').then(async r => r.text());
  const messages = JSON.parse(content) as Record<string, LanguageRecord>;

  return messages;
}
