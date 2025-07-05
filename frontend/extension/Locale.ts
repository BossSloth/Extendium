/* eslint-disable @typescript-eslint/class-methods-use-this */
import { Extension } from './Extension';

export class Locale {
  private messages: Record<string, LanguageRecord> | undefined;

  constructor(readonly extension: Extension) {
  }

  async initLocale(): Promise<void> {
    const defaultLocale = this.extension.manifest.default_locale;
    if (defaultLocale === undefined) {
      // This extension does not have locales
      return;
    }

    const language = navigator.language.split('-')[0];
    let content;
    try {
      content = await fetch(this.extension.getFileUrl(`/_locales/${language}/messages.json`) ?? '').then(async r => r.text());
    } catch {
      console.debug(`[${this.extension.getName()}] Locale ${language} not found, falling back to default locale (${defaultLocale})`);
      // Fallback to default locale (en) if the requested locale doesn't exist
      content = await fetch(this.extension.getFileUrl(`/_locales/${defaultLocale}/messages.json`) ?? '').then(async r => r.text());
    }
    this.messages = JSON.parse(content) as Record<string, LanguageRecord>;
  }

  getMessage(messageKey: string, substitutions?: string[] | string): string {
    const predefinedMessage = this.getPredefinedMessage(messageKey);
    if (predefinedMessage !== undefined) {
      return predefinedMessage;
    }

    if (this.messages === undefined) {
      throw new Error(`[${this.extension.getName()}] Locale not initialized, missing manifest.default_locale?`);
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
      message = message.replace(`$${i}`, substitutions[i - 1] ?? '');
    }

    return message;
  }

  getUILanguage(): string {
    return navigator.language;
  }

  async getAcceptLanguages(): Promise<string[]> {
    return Promise.resolve([navigator.language]);
  }

  async detectLanguage(): Promise<chrome.i18n.LanguageDetectionResult> {
    return Promise.resolve({ language: navigator.language, isReliable: true, languages: [{ language: navigator.language, percentage: 100 }] });
  }

  getPredefinedMessage(key: string): string | undefined {
    switch (key) {
      case '@@extension_id': return '1234';
      case '@@ui_locale': return navigator.language.split('-')[0];
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
}

interface LanguageRecord {
  message: string;
  placeholders?: Record<string, { content: string; }>;
}
