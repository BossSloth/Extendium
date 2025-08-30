import { Action } from './Action';
import { ChromeEvent } from './ChromeEvent';
import { Contexts } from './Contexts';
import { Locale } from './Locale';
import { Logger } from './Logger';
import { RuntimeEmulator } from './Messaging';
import { ExtensionMetadata } from './Metadata';
import { Options } from './Options';

export class Extension {
  public readonly action: Action;
  public readonly runtimeEmulator: RuntimeEmulator;
  public readonly contexts: Contexts;
  public readonly locale: Locale;
  public readonly storageOnChanged = new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>();
  public readonly logger: Logger;
  public readonly options: Options;

  constructor(readonly manifest: chrome.runtime.ManifestV3, readonly url: string, readonly folderName: string, readonly metadata?: ExtensionMetadata) {
    this.action = new Action(this);
    this.runtimeEmulator = new RuntimeEmulator(this);
    this.contexts = new Contexts();
    this.locale = new Locale(this);
    this.logger = new Logger(this, true, 'Extension');
    this.options = new Options(this);
  }

  public async init(): Promise<void> {
    await this.locale.initLocale();
    this.action.initTitle();
  }

  /**
   * Returns the URL of a file in the extension.
   * @param path The path to the file. For example, "images/icon-16.png".
   * @returns The URL of the file.
   */
  public getFileUrl(path: string | undefined): string | undefined {
    if (path === undefined || path.startsWith(this.url)) {
      return path;
    }

    if (path.trim() === '') {
      return this.url;
    }

    if (path.startsWith('/')) {
      return `${this.url}${path}`;
    }

    if (path.startsWith('./')) {
      return `${this.url}${path.slice(1)}`;
    }

    if (path.startsWith('../')) {
      return `${this.url}${path.slice(2)}`;
    }

    return `${this.url}/${path}`;
  }

  public getFileDir(path: string | undefined): string {
    if (path === undefined) {
      return this.url;
    }

    let dir = this.getFileUrl(path.split('/').slice(0, -1).join('/')) ?? this.url;
    if (!dir.endsWith('/')) {
      dir += '/';
    }

    return dir;
  }

  public getBackgroundUrl(): string | undefined {
    return this.getFileUrl(this.manifest.background?.service_worker);
  }

  public getName(): string {
    const name = this.manifest.name;

    return this.tryGetLocaleMessage(name);
  }

  public getDescription(): string | undefined {
    const description = this.manifest.description;
    if (description !== undefined) {
      return this.tryGetLocaleMessage(description);
    }

    return description;
  }

  public getVersion(): string {
    return this.manifest.version;
  }

  public tryGetLocaleMessage(key: string): string {
    if (key.startsWith('__MSG_')) {
      return this.locale.getMessage(this.locale.getMSGKey(key));
    }

    return key;
  }
}
