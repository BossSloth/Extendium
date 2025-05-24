import { StorageClearContent, StorageGetSetContent, StorageRemoveContent, WebkitRequestType } from '../extension/websocket/MessageTypes';
import { webSocketClient } from '../shared';

export class WebkitStorage implements chrome.storage.StorageArea {
  constructor(private readonly extensionName: string, private readonly area: chrome.storage.AreaName) {}

  async get<T extends Record<string, unknown>>(
    keys: T,
    callback?: (items: T) => void,
  ): Promise<T> {
    const message: StorageGetSetContent = {
      area: this.area,
      keys,
    };
    const response = await webSocketClient.sendMessage(message, WebkitRequestType.GetStorage, this.extensionName) as T;

    if (callback) {
      callback(response);
    }

    return response;
  }

  async set(items: Record<string, unknown>, callback?: () => void): Promise<void> {
    const message: StorageGetSetContent = {
      area: this.area,
      keys: items,
    };
    await webSocketClient.sendMessage(message, WebkitRequestType.SetStorage, this.extensionName);

    if (callback) {
      callback();
    }

    return Promise.resolve();
  }

  async remove(keys: string | string[], callback?: () => void): Promise<void> {
    const message: StorageRemoveContent = {
      area: this.area,
      keys,
    };
    await webSocketClient.sendMessage(message, WebkitRequestType.RemoveStorage, this.extensionName);

    if (callback) {
      callback();
    }

    return Promise.resolve();
  }

  async clear(callback?: () => void): Promise<void> {
    const message: StorageClearContent = {
      area: this.area,
    };
    await webSocketClient.sendMessage(message, WebkitRequestType.ClearStorage, this.extensionName);

    if (callback) {
      callback();
    }

    return Promise.resolve();
  }
}
