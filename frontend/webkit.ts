/* eslint-disable @typescript-eslint/class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { createChrome } from './browser/createChrome';
import { Extension } from './extension/Extension';
import { base64Decode, base64Encode } from './extension/utils';
import { addTab, focusTab } from './TabManager';
import { WebSocketServer } from './websocket/WebSocketServer';

// Create a singleton instance of the WebSocket server
const webSocketServer = new WebSocketServer();

export class Webkit {
  private readonly chrome: typeof window.chrome;

  constructor(readonly extension: Extension) {
    this.chrome = createChrome('content', this.extension);
  }

  async sendMessage(content: unknown): Promise<string> {
    return this.chrome.runtime.sendMessage(content);
  }

  async getStorage(area: chrome.storage.AreaName, keys: string): Promise<Record<string, unknown>> {
    const parsedKeys = JSON.parse(base64Decode(keys)) as string[];
    switch (area) {
      case 'sync':
        return this.chrome.storage.sync.get(parsedKeys);
      case 'local':
        return this.chrome.storage.local.get(parsedKeys);
      case 'session':
        return this.chrome.storage.session.get(parsedKeys);
      case 'managed':
        return this.chrome.storage.managed.get(parsedKeys);
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Unsupported storage area: ${area}`);
    }
  }

  async setStorage(area: chrome.storage.AreaName, keys: string): Promise<void> {
    const parsedKeys = JSON.parse(base64Decode(keys)) as Record<string, unknown>;
    switch (area) {
      case 'sync':
        return this.chrome.storage.sync.set(parsedKeys);
      case 'local':
        return this.chrome.storage.local.set(parsedKeys);
      case 'session':
        return this.chrome.storage.session.set(parsedKeys);
      case 'managed':
        return this.chrome.storage.managed.set(parsedKeys);
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Unsupported storage area: ${area}`);
    }
  }
}

export class WebkitWrapper {
  private readonly webkits = new Map<string, Webkit>();

  init(extensions: Map<string, Extension>): void {
    for (const [name, extension] of extensions) {
      this.webkits.set(name, new Webkit(extension));
    }

    // Set this wrapper in the WebSocketServer
    webSocketServer.setWebkitWrapper(this);
  }

  findWebkit(extensionName: string): Webkit {
    const webkit = this.webkits.get(extensionName);
    if (!webkit) {
      throw new Error(`Webkit for extension ${extensionName} not found`);
    }

    return webkit;
  }

  async sendMessage(extensionName: string, content: unknown): Promise<string> {
    const response = await this.findWebkit(extensionName).sendMessage(content);

    return response;
  }

  addTab(tabInfoBase64: string): number {
    return addTab(tabInfoBase64);
  }

  focusTab(tabId: number): void {
    focusTab(tabId);
  }

  async getStorage(extensionName: string, area: chrome.storage.AreaName, keys: string): Promise<string> {
    const response = await this.findWebkit(extensionName).getStorage(area, keys);

    return base64Encode(JSON.stringify(response));
  }

  async setStorage(extensionName: string, area: chrome.storage.AreaName, keys: string): Promise<void> {
    return this.findWebkit(extensionName).setStorage(area, keys);
  }
}
