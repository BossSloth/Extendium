import { Extension } from './Extension';

export class Action {
  private iconUrl: string | undefined;
  private iconUrlListeners: (() => void)[] = [];

  constructor(readonly extension: Extension) {
    this.initIconUrl();
  }

  public getPopupUrl(): string | undefined {
    return this.extension.getFileUrl(this.extension.manifest.action?.default_popup);
  }

  public getTitle(): string | undefined {
    return this.extension.manifest.action?.default_title ?? this.extension.manifest.name;
  }

  // #region icon
  /**
   * Selects the best icon path from a manifest icon object based on the user's screen pixel density.
   * @param icons - The icon object from the manifest (e.g., {16: 'icon16.png', 32: 'icon32.png', 48: 'icon48.png', 128: 'icon128.png'})
   * @returns The path to the best icon for the current device, or undefined if not found.
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public static selectBestIconPath(icons: Record<string, string>): string | undefined {
    // Typical icon sizes in Chrome extensions: 16, 32, 48, 128
    // Chrome picks the closest size >= (16 * devicePixelRatio), or the largest available if none are big enough
    const dpr = window.devicePixelRatio;
    const desiredSize = 16 * dpr;
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
    if (this.extension.manifest.action?.default_icon === undefined) {
      this.iconUrl = undefined;

      return;
    }

    const defaultIcon = this.extension.manifest.action.default_icon;
    if (typeof defaultIcon === 'string') {
      this.iconUrl = this.extension.getFileUrl(defaultIcon);
    } else if (typeof defaultIcon === 'object') {
      // Use the new selection function for best icon
      // Ensure type compatibility: ManifestIcons may not be Record<string, string>, so cast safely
      const bestIcon = Action.selectBestIconPath(defaultIcon as Record<string, string>);
      this.iconUrl = bestIcon !== undefined && bestIcon !== '' ? this.extension.getFileUrl(bestIcon) : undefined;
    } else {
      this.iconUrl = undefined;
    }
  }
  // #endregion icon
}
