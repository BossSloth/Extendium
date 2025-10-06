/* eslint-disable @typescript-eslint/class-methods-use-this */
import { EnumerableMethods } from './EnumerableMethods';
import { Extension } from './Extension';

type chromeLocale = typeof chrome.i18n;

@EnumerableMethods
export class Locale implements chromeLocale {
  private messages: Record<string, LanguageRecord> | undefined;
  readonly #extension: Extension;

  private readonly defaultLocale: string | undefined;

  constructor(extension: Extension) {
    this.#extension = extension;
    this.defaultLocale = this.#extension.manifest.default_locale;
  }

  async initLocale(): Promise<void> {
    if (this.defaultLocale === undefined) {
      // This extension does not have locales
      return;
    }

    const language = this.getUILanguageKey();
    let content;
    try {
      content = await this.fetchLocale(language);
    } catch {
      const shortLanguage = navigator.language.split('-')[0] ?? '';
      this.#extension.logger.log('Locale', `Locale ${language} not found, falling back to short locale (${shortLanguage})`);
      try {
        content = await this.fetchLocale(shortLanguage);
      } catch {
        this.#extension.logger.log('Locale', `Locale ${shortLanguage} not found, falling back to default locale (${this.defaultLocale})`);
        // Fallback to default locale (en) if the requested locale doesn't exist
        content = await this.fetchLocale(this.defaultLocale);
      }
    }
    this.messages = JSON.parse(content) as Record<string, LanguageRecord>;
  }

  async fetchLocale(language: string): Promise<string> {
    const response = await fetch(this.#extension.getFileUrl(`/_locales/${language}/messages.json`) ?? '');
    if (!response.ok) {
      throw new Error(`Failed to fetch locale ${language}`);
    }

    return response.text();
  }

  getMessage(messageKey: string, substitutions?: (string | number)[] | string): string {
    const predefinedMessage = this.getPredefinedMessage(messageKey);
    if (predefinedMessage !== undefined) {
      return predefinedMessage;
    }

    if (this.messages === undefined) {
      throw new Error(`[${this.#extension.url}] Locale not initialized, missing manifest.default_locale?`);
    }

    if (typeof substitutions === 'string') {
      substitutions = [substitutions];
    }

    const record = this.messages[messageKey];
    if (!record) {
      return messageKey;
    }

    if (!substitutions) {
      return record.message;
    }

    let message = record.message;

    const placeholders = record.placeholders ?? {};
    for (const [key, value] of Object.entries(placeholders)) {
      message = message.replace(`$${key.toUpperCase()}$`, value.content);
      message = message.replace(`$${key}$`, value.content);
    }

    for (let i = 1; i <= substitutions.length; i++) {
      message = message.replace(`$${i}`, substitutions[i - 1]?.toString() ?? '');
    }

    return message;
  }

  async getAcceptLanguages(): Promise<string[]> {
    return Promise.resolve([...navigator.languages]);
  }

  async detectLanguage(): Promise<chrome.i18n.LanguageDetectionResult> {
    return Promise.resolve({ language: this.getUILanguageKey(), isReliable: true, languages: [{ language: this.getUILanguageKey(), percentage: 100 }] });
  }

  getPredefinedMessage(key: string): string | undefined {
    switch (key) {
      case '@@extension_id': return '1234';
      case '@@ui_locale': return this.getUILanguageKey();
      case '@@bidi_dir': return document.body.dir;
      case '@@bidi_reversed_dir': return document.body.dir === 'ltr' ? 'rtl' : 'ltr';
      case '@@bidi_start_edge': return document.body.dir === 'ltr' ? 'left' : 'right';
      case '@@bidi_end_edge': return document.body.dir === 'ltr' ? 'right' : 'left';
      default: return undefined;
    }
  }

  getMSGKey(key: string): string {
    return key.replaceAll(/__MSG_(.+)__/g, '$1');
  }

  getUILanguage(): string {
    return navigator.language;
  }

  getUILanguageKey(): string {
    return this.getUILanguage().replaceAll('-', '_');
  }

  // TODO: Figure out why I did this?
  // getUILanguage(): string {
  //   const longRegionLocales = ['es-419', 'pt-BR', 'pt-PT', 'zh-CN', 'zh-TW'];
  //   let language = navigator.language;
  //   if (!longRegionLocales.includes(language)) {
  //     language = language.split('-')[0] ?? '';
  //   }

  //   return language.replaceAll('-', '_');
  // }

  isReady(): boolean {
    return this.messages !== undefined || this.defaultLocale === undefined;
  }
}

interface LanguageRecord {
  message: string;
  placeholders?: Record<string, { content: string; }>;
}
