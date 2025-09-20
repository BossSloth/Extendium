import { ChromeEvent } from './ChromeEvent';
import { Extension } from './Extension';

export class Action {
  private iconUrl: string | undefined;
  private iconUrlListeners: (() => void)[] = [];
  private title: string | undefined;

  constructor(readonly extension: Extension) {
    this.initIconUrl();
  }

  public getPopupUrl(): string | undefined {
    return this.extension.getFileUrl(this.extension.manifest.action?.default_popup);
  }

  public getPopupDir(): string | undefined {
    return this.extension.getFileDir(this.extension.manifest.action?.default_popup);
  }

  // #region icon
  /**
   * Selects the best icon path from a manifest icon object based on the user's screen pixel density.
   * @param icons - The icon object from the manifest (e.g., {16: 'icon16.png', 32: 'icon32.png', 48: 'icon48.png', 128: 'icon128.png'})
   * @returns The path to the best icon for the current device, or undefined if not found.
   */

  public static selectBestIconPath(icons: Record<string, string>, preferredIconSize?: number): string | undefined {
    // Typical icon sizes in Chrome extensions: 16, 32, 48, 128
    // Chrome picks the closest size >= (16 * devicePixelRatio), or the largest available if none are big enough
    const dpr = window.devicePixelRatio;
    const desiredSize = preferredIconSize ?? 16 * dpr;
    const sizes = Object.keys(icons)
      .map(Number)
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    // Find the smallest icon >= desiredSize
    let bestSize = sizes.find(size => size >= desiredSize);
    if (bestSize === undefined && sizes.length > 0) {
      // Fallback: use the largest available
      bestSize = sizes[sizes.length - 1];
    }

    return bestSize !== undefined ? icons[String(bestSize)] : undefined;
  }

  public getIconUrl(): string | undefined {
    return this.iconUrl;
  }

  public async setIcon(details: chrome.action.TabIconDetails): Promise<void> {
    if (details.path === undefined) {
      return;
    }

    if (typeof details.path === 'string') {
      this.updateIconUrl(details.path);
    } else if (typeof details.path === 'object') {
      const bestIcon = Action.selectBestIconPath(details.path);
      this.updateIconUrl(bestIcon);
    }

    return Promise.resolve();
  }

  public updateIconUrl(newUrl: string | undefined): void {
    this.iconUrl = this.extension.getFileUrl(newUrl);
    this.notifyIconUrlListeners();
  }

  public subscribeToIconUrlChange(listener: () => void): void {
    this.iconUrlListeners.push(listener);
  }

  public unsubscribeFromIconUrlChange(listener: () => void): void {
    this.iconUrlListeners = this.iconUrlListeners.filter(l => l !== listener);
  }

  private notifyIconUrlListeners(): void {
    for (const listener of this.iconUrlListeners) {
      listener();
    }
  }

  private initIconUrl(): void {
    this.iconUrl = this.getDefaultIconUrl();
  }

  public getDefaultIconUrl(preferredIconSize?: number): string | undefined {
    const icons = this.extension.manifest.icons ?? this.extension.manifest.action?.default_icon;
    if (icons === undefined) {
      return undefined;
    }

    if (typeof icons === 'string') {
      return this.extension.getFileUrl(icons);
    } else if (typeof icons === 'object') {
      // Use the new selection function for best icon
      // Ensure type compatibility: ManifestIcons may not be Record<string, string>, so cast safely
      const bestIcon = Action.selectBestIconPath(icons as Record<string, string>, preferredIconSize);

      return bestIcon !== undefined && bestIcon !== '' ? this.extension.getFileUrl(bestIcon) : undefined;
    }

    return undefined;
  }
  // #endregion icon

  // #region title
  public getTitle(): string {
    return this.title ?? this.extension.getName();
  }

  public setTitle(title: string): void {
    this.title = title;
  }

  public initTitle(): void {
    this.title = this.getDefaultTitle();
  }

  private getDefaultTitle(): string {
    const defaultTitle = this.extension.manifest.action?.default_title;
    if (defaultTitle !== undefined) {
      return this.extension.tryGetLocaleMessage(defaultTitle);
    }

    return this.extension.getName();
  }
  // #endregion title

  // #region onClicked
  public onClicked = new ChromeEvent<(tab?: chrome.tabs.Tab) => void>();
  // #endregion onClicked
}
