import { ExtensionInfo } from '../../frontend/chrome/types';
import { Action } from './Action';
import { ChromeEvent } from './ChromeEvent';
import { Logger } from './Logger';
import { Options } from './Options';

export class Extension {
  public readonly onInstalled = new ChromeEvent<(details: chrome.runtime.InstalledDetails) => void>();
  public readonly onStorageChanged = new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>();

  public readonly action: Action;
  public readonly logger: Logger;
  public readonly options: Options;

  constructor(readonly manifest: chrome.runtime.ManifestV3, readonly extensionInfo: ExtensionInfo) {
    this.action = new Action(this);
    this.logger = new Logger(this, true, 'Extension');
    this.options = new Options(this);
  }

  public init(): void {
    this.logger.init();
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
