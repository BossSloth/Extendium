import { Extension } from './extension/Extension';
import { createWindowWithScript } from './windowManagement';

/* eslint-disable @typescript-eslint/no-empty-function */
export async function injectBrowser(context: string, window: Window, extension: Extension): Promise<void> {
  window.chrome = await createChrome(context, extension);
  // @ts-expect-error Property 'clients' does not exist on type 'Window'.
  window.clients = {
    matchAll: async (): Promise<unknown[]> => Promise.resolve([]),
  };
}

async function createChrome(context: string, extension: Extension): Promise<typeof window.chrome> {
  const localeMessages = await initLocale(extension);

  return {
    i18n: {
      getMessage: (messageKey: string, substitutions?: string[] | string): string => {
        if (typeof substitutions === 'string') {
          substitutions = [substitutions];
        }
        const record = localeMessages.get(messageKey);
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
      local: {
        set: (): unknown => { return {}; },
        get: (): unknown => { return {}; },
      },
    },
    runtime: {
      // @ts-expect-error Ignore
      sendMessage: async (...args): Promise<unknown> => { return extension.runtimeEmulator.sendMessage(context, ...args); },
      // @ts-expect-error Ignore
      onMessage: {
        addListener: (...args): void => { extension.runtimeEmulator.onMessage.addListener(context, ...args); },
        // @ts-expect-error Ignore
        removeListener: (...args): void => { extension.runtimeEmulator.onMessage.removeListener(context, ...args); },
        hasListeners: (): boolean => { return extension.runtimeEmulator.onMessage.hasListeners(); },
        hasListener: (...args): boolean => { return extension.runtimeEmulator.onMessage.hasListener(context, ...args); },
      },
      getURL: (path: string): string => extension.getFileUrl(path) ?? '',
    },
    tabs: {
      query: (): void => {},
      create: async (properties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
        SteamClient.System.OpenInSystemBrowser(properties.url ?? '');

        return Promise.resolve({});
      },
    },
    offscreen: {
      createDocument: async (parameters: chrome.offscreen.CreateParameters): Promise<void> => {
        await createWindowWithScript(parameters.url, extension, `${extension.manifest.name} - ${parameters.url}`);
      },
    },
    windows: {
      getAll: async (): Promise<chrome.windows.Window[]> => Promise.resolve([]),
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

async function initLocale(extension: Extension): Promise<Map<string, LanguageRecord>> {
  const language = navigator.language.split('-')[0];
  const content = await fetch(extension.getFileUrl(`/_locales/${language}/messages.json`) ?? '').then(async r => r.text());
  const messages = JSON.parse(content) as Record<string, LanguageRecord>;
  const localeMessages = new Map<string, LanguageRecord>();
  for (const [key, value] of Object.entries(messages)) {
    localeMessages.set(key, value);
  }

  return localeMessages;
}
