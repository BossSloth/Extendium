import { callable } from '@steambrew/webkit';
import { base64Decode, base64Encode } from '../extension/utils';

const storageGet = callable<[{ extensionName: string; area: chrome.storage.AreaName; keys: string; }], string>('Webkit.GetStorage');
const storageSet = callable<[{ extensionName: string; area: chrome.storage.AreaName; keys: string; }], string>('Webkit.SetStorage');

export class WebkitStorage implements chrome.storage.StorageArea {
  constructor(private readonly extensionName: string, private readonly area: chrome.storage.AreaName) {}

  async get<T = Record<string, unknown>>(
    keys: NoInferX<keyof T> | NoInferX<keyof T>[] | Partial<NoInferX<T>> | null | ((items: T) => void),
    callback?: (items: T) => void,
  ): Promise<T> {
    const response = await storageGet({ extensionName: this.extensionName, keys: base64Encode(JSON.stringify(keys)), area: this.area });
    const data = JSON.parse(base64Decode(response)) as T;

    if (callback) {
      callback(data);
    }

    return data;
  }

  async set(items: Record<string, unknown>, callback?: () => void): Promise<void> {
    await storageSet({ extensionName: this.extensionName, keys: base64Encode(JSON.stringify(items)), area: this.area });

    if (callback) {
      callback();
    }

    return Promise.resolve();
  }
}

type NoInferX<T> = T[][T extends unknown ? 0 : never];
