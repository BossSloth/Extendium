/* eslint-disable max-classes-per-file */
import { Contexts } from './Contexts';
import { RuntimeEmulator } from './Messaging';

export class Extension {
  public readonly action: Action;
  public readonly runtimeEmulator: RuntimeEmulator;
  public readonly contexts: Contexts;

  constructor(readonly manifest: chrome.runtime.ManifestV3, readonly url: string) {
    this.action = new Action(this);
    this.runtimeEmulator = new RuntimeEmulator(this);
    this.contexts = new Contexts();
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

    if (path.startsWith('/')) {
      return `${this.url}${path}`;
    }

    return `${this.url}/${path}`;
  }

  public getBackgroundUrl(): string | undefined {
    return this.getFileUrl(this.manifest.background?.service_worker);
  }
}

export class Action {
  constructor(readonly parent: Extension) {
  }

  public getPopupUrl(): string | undefined {
    return this.parent.getFileUrl(this.parent.manifest.action?.default_popup);
  }

  public getTitle(): string | undefined {
    return this.parent.manifest.action?.default_title ?? this.parent.manifest.name;
  }

  public getIconUrl(): string | undefined {
    if (this.parent.manifest.action?.default_icon === undefined) {
      return undefined;
    }

    const defaultIcon = this.parent.manifest.action.default_icon;
    if (typeof defaultIcon === 'string') {
      return this.parent.getFileUrl(defaultIcon);
    }

    const iconPathKey = Object.keys(defaultIcon)[0];

    if (iconPathKey === undefined) {
      return undefined;
    }

    const iconPath = defaultIcon[Number.parseInt(iconPathKey)];

    if (iconPath === undefined) {
      return undefined;
    }

    return this.parent.getFileUrl(iconPath);
  }
}
