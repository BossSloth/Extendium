import { Extension } from './Extension';

export class Action {
  constructor(readonly extension: Extension) {}

  get iconUrl(): string {
    return this.extension.extensionInfo.iconUrl;
  }

  get popupUrl(): string | undefined {
    return this.extension.manifest.action?.default_popup;
  }
}
