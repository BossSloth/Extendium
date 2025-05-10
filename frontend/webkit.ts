/* eslint-disable @typescript-eslint/class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { createChrome } from './browser/createChrome';
import { Extension } from './extension/Extension';
import { base64Decode, base64Encode } from './extension/utils';
import { addTab, focusTab } from './TabManager';

export class Webkit {
  private readonly chrome: typeof window.chrome;

  constructor(readonly extension: Extension) {
    this.chrome = createChrome('content', this.extension);
  }

  async sendMessage(content: string): Promise<string> {
    const obj = JSON.parse(base64Decode(content)) as unknown;

    return this.chrome.runtime.sendMessage(obj);
  }
}

export class WebkitWrapper {
  private readonly webkits = new Map<string, Webkit>();

  init(extensions: Map<string, Extension>): void {
    for (const [name, extension] of extensions) {
      this.webkits.set(name, new Webkit(extension));
    }
  }

  async sendMessage(extensionName: string, content: string): Promise<string> {
    const webkit = this.webkits.get(extensionName);
    if (!webkit) {
      return 'Extension not found';
    }

    const response = await webkit.sendMessage(content);

    return base64Encode(JSON.stringify(response));
  }

  addTab(tabInfoBase64: string): number {
    return addTab(tabInfoBase64);
  }

  focusTab(tabId: number): void {
    focusTab(tabId);
  }
}
