import { Action } from './Action';
import { ChromeEvent } from './ChromeEvent';
import { Contexts } from './Contexts';
import { Locale } from './Locale';
import { RuntimeEmulator } from './Messaging';

export class Extension {
  public readonly action: Action;
  public readonly runtimeEmulator: RuntimeEmulator;
  public readonly contexts: Contexts;
  public readonly locale: Locale;
  public readonly storageOnChanged = new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>();

  constructor(readonly manifest: chrome.runtime.ManifestV3, readonly url: string) {
    this.action = new Action(this);
    this.runtimeEmulator = new RuntimeEmulator(this);
    this.contexts = new Contexts();
    this.locale = new Locale(this);
  }

  public async init(): Promise<void> {
    await this.locale.initLocale();
  }

  /**
   * Returns the URL of a file in the extension.
   * @param path The path to the file. For example, "images/icon-16.png".
   * @returns The URL of the file.
   */
  public getFileUrl(path: string | undefined): string | undefined {
    if (path === undefined) {
      return undefined;
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
    return this.manifest.name;
  }

  public getVersion(): string {
    return this.manifest.version;
  }
}
