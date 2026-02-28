import { ExtensionInfo } from '../../frontend/chrome/types';
import { Action } from './Action';
import { ChromeEvent } from './ChromeEvent';
import { Locale } from './Locale';
import { Logger } from './Logger';
import { Options } from './Options';

export class Extension {
  public readonly onInstalled = new ChromeEvent<(details: chrome.runtime.InstalledDetails) => void>();
  public readonly onStorageChanged = new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>();

  public readonly action: Action;
  public readonly locale: Locale;
  public readonly logger: Logger;
  public readonly options: Options;

  constructor(readonly manifest: chrome.runtime.ManifestV3, readonly extensionInfo: ExtensionInfo) {
    this.action = new Action(this);
    this.locale = new Locale(this);
    this.logger = new Logger(this, true, 'Extension');
    this.options = new Options(this);
  }

  public init(): void {
    // await this.locale.initLocale();
    this.logger.init();
  }

  // /**
  //  * Returns the URL of a file in the extension.
  //  * @param path The path to the file. For example, "images/icon-16.png".
  //  * @returns The URL of the file.
  //  */
  // public getFileUrl(path: string | undefined): string | undefined {
  //   if (path === undefined || path.startsWith(this.url)) {
  //     return path;
  //   }

  //   if (path.trim() === '') {
  //     return this.url;
  //   }

  //   if (path.startsWith('/')) {
  //     return `${this.url}${path}`;
  //   }

  //   if (path.startsWith('./')) {
  //     return `${this.url}${path.slice(1)}`;
  //   }

  //   if (path.startsWith('../')) {
  //     return `${this.url}${path.slice(2)}`;
  //   }

  //   return `${this.url}/${path}`;
  // }

  // public getFileDir(path: string | undefined): string {
  //   if (path === undefined) {
  //     return this.url;
  //   }

  //   let dir = this.getFileUrl(path.split('/').slice(0, -1).join('/')) ?? this.url;
  //   if (!dir.endsWith('/')) {
  //     dir += '/';
  //   }

  //   return dir;
  // }

  /** @deprecated */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public getFileDir(path: string | undefined): string {
    return path ?? '';
  }

  /** @deprecated */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public getFileUrl(path: string | undefined): string | undefined {
    return path;
  }

  /** @deprecated */
  public getBackgroundUrl(): string | undefined {
    return this.getFileUrl(this.manifest.background?.service_worker);
  }

  /** @deprecated */
  public getName(): string {
    const name = this.manifest.name;

    return this.tryGetLocaleMessage(name);
  }

  /** @deprecated */
  public getDescription(): string | undefined {
    const description = this.manifest.description;
    if (description !== undefined) {
      return this.tryGetLocaleMessage(description);
    }

    return description;
  }

  /** @deprecated */
  public getVersion(): string {
    return this.manifest.version;
  }

  /** @deprecated */
  public tryGetLocaleMessage(key: string): string {
    if (key.startsWith('__MSG_')) {
      return this.locale.getMessage(this.locale.getMSGKey(key));
    }

    return key;
  }

  get name(): string {
    return this.extensionInfo.name;
  }

  get description(): string | undefined {
    return this.extensionInfo.description;
  }

  get version(): string {
    return this.extensionInfo.version;
  }

  get id(): string {
    return this.extensionInfo.id;
  }

  get enabled(): boolean {
    return this.extensionInfo.state === 'ENABLED';
  }
}
