import { Extension } from './Extension';

export class Options {
  constructor(readonly extension: Extension) {
  }

  public hasOptions(): boolean {
    return this.getOptionsPageUrl() !== undefined;
  }

  public getOptionsPageUrl(): string | undefined {
    return this.extension.extensionInfo.optionsPage?.url;
  }
}
