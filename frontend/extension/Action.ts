import { Extension } from './Extension';

export class Action {
  constructor(readonly extension: Extension) {
  }

  public getPopupUrl(): string | undefined {
    return this.extension.getFileUrl(this.extension.manifest.action?.default_popup);
  }

  public getTitle(): string | undefined {
    return this.extension.manifest.action?.default_title ?? this.extension.manifest.name;
  }

  public getIconUrl(): string | undefined {
    if (this.extension.manifest.action?.default_icon === undefined) {
      return undefined;
    }

    const defaultIcon = this.extension.manifest.action.default_icon;
    if (typeof defaultIcon === 'string') {
      return this.extension.getFileUrl(defaultIcon);
    }

    const iconPathKey = Object.keys(defaultIcon)[0];

    if (iconPathKey === undefined) {
      return undefined;
    }

    const iconPath = defaultIcon[Number.parseInt(iconPathKey)];

    if (iconPath === undefined) {
      return undefined;
    }

    return this.extension.getFileUrl(iconPath);
  }
}
