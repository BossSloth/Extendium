/* eslint-disable max-classes-per-file */
import { createChrome } from './browser/createChrome';
import { Extension } from './extension/Extension';

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

function base64Decode(content: string): string {
  return window.atob(content);
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

    return base64Encode(JSON.stringify(await webkit.sendMessage(content)));
  }
}

function base64Encode(content: string): string {
  return window.btoa(content);
}
