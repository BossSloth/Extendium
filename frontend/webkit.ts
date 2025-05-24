/* eslint-disable @typescript-eslint/class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { createChrome } from './browser/createChrome';
import { Extension } from './extension/Extension';
import { StorageClearContent, StorageGetSetContent, StorageRemoveContent } from './extension/websocket/MessageTypes';
import { addTab, focusTab } from './TabManager';
import { WebSocketServer } from './websocket/WebSocketServer';

// Create a singleton instance of the WebSocket server
const webSocketServer = new WebSocketServer();

export class Webkit {
  public readonly chrome: typeof window.chrome;

  constructor(readonly extension: Extension) {
    this.chrome = createChrome('content', this.extension);
  }

  async sendMessage(content: unknown): Promise<string> {
    return this.chrome.runtime.sendMessage(content);
  }

  getStorageArea(area: chrome.storage.AreaName): chrome.storage.StorageArea {
    switch (area) {
      case 'sync':
        return this.chrome.storage.sync;
      case 'local':
        return this.chrome.storage.local;
      case 'session':
        return this.chrome.storage.session;
      case 'managed':
        return this.chrome.storage.managed;
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

  async getStorage(extensionName: string, content: StorageGetSetContent): Promise<Record<string, unknown>> {
    return this.findWebkit(extensionName).getStorageArea(content.area).get(content.keys);
  }

  async setStorage(extensionName: string, content: StorageGetSetContent): Promise<void> {
    return this.findWebkit(extensionName).getStorageArea(content.area).set(content.keys);
  }

  async removeStorage(extensionName: string, content: StorageRemoveContent): Promise<void> {
    return this.findWebkit(extensionName).getStorageArea(content.area).remove(content.keys);
  }

  async clearStorage(extensionName: string, content: StorageClearContent): Promise<void> {
    return this.findWebkit(extensionName).getStorageArea(content.area).clear();
  }

  openOptions(extensionName: string): void {
    this.findWebkit(extensionName).chrome.runtime.openOptionsPage();
  }
}
