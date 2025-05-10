/* eslint-disable @typescript-eslint/class-methods-use-this */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { ChromeEvent } from './ChromeEvent';
import { Extension } from './Extension';
import { Logger } from './Logger';

export class Storage implements chrome.storage.StorageArea {
  public readonly QUOTA_BYTES: number; // Example: local = 5MB, sync = 100KB

  public readonly onChanged = new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>();

  private readonly STORAGE_KEY: string;

  constructor(readonly extension: Extension, readonly area: chrome.storage.AreaName, readonly logger: Logger) {
    this.STORAGE_KEY = `${this.extension.manifest.name}::${this.area}`;

    if (this.area === 'local') {
      this.QUOTA_BYTES = 5 * 1024 * 1024; // 5MB
    } else if (this.area === 'sync') {
      this.QUOTA_BYTES = 100 * 1024; // 100KB
    } else {
      this.QUOTA_BYTES = 1024; // 1KB
    }
  }

  async get<T = Record<string, unknown>>(
    keys: NoInferX<keyof T> | NoInferX<keyof T>[] | Partial<NoInferX<T>> | null | ((items: T) => void),
    callback?: (items: T) => void,
  ): Promise<T> {
    this.logger.log(`storage.${this.area}.get`, keys, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    let result: Record<string, unknown> = {};
    let keysToRetrieve: string[] = [];

    if (storedData === null) {
      if (callback) {
        callback(keys as T);
      }

      return Promise.resolve(keys as T);
    }

    const data = JSON.parse(storedData) as Record<string, unknown>;

    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }

    if (keys === null) {
      result = { ...data };
    } else if (typeof keys === 'string') {
      keysToRetrieve = [keys];
    } else if (Array.isArray(keys)) {
      keysToRetrieve = keys.map(key => String(key));
    } else {
      keysToRetrieve = Object.keys(keys);
    }

    for (const key of keysToRetrieve) {
      result[key] = data[key];
    }

    if (callback) {
      callback(result as T);
    }

    return Promise.resolve(result as T);
  }

  async set(items: Record<string, unknown>, callback?: () => void): Promise<void> {
    this.logger.log(`storage.${this.area}.set`, items, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const data = storedData !== null ? JSON.parse(storedData) as Record<string, unknown> : {};

    const oldValues: Record<string, unknown> = { ...data };

    Object.assign(data, items);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

    if (callback) {
      callback();
    }

    const changes: Record<string, chrome.storage.StorageChange> = {};

    for (const key of Object.keys(items)) {
      changes[key] = {
        oldValue: oldValues[key],
        newValue: items[key],
      };
    }

    this.extension.storageOnChanged.emit(changes, this.area);
    this.onChanged.emit(changes, this.area);

    return Promise.resolve();
  }

  async remove(keys: string | string[], callback?: () => void): Promise<void> {
    this.logger.log(`storage.${this.area}.remove`, keys, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const data = storedData !== null ? JSON.parse(storedData) as Record<string, unknown> : {};

    const oldValues: Record<string, unknown> = { ...data };

    if (typeof keys === 'string') {
      delete data[keys];
    } else if (Array.isArray(keys)) {
      for (const key of keys) {
        delete data[key];
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

    if (callback) {
      callback();
    }

    const changes: Record<string, chrome.storage.StorageChange> = {};

    for (const key of keys) {
      changes[key] = {
        oldValue: oldValues[key],
        newValue: undefined,
      };
    }

    this.extension.storageOnChanged.emit(changes, this.area);
    this.onChanged.emit(changes, this.area);

    return Promise.resolve();
  }

  async clear(callback?: () => void): Promise<void> {
    this.logger.log(`storage.${this.area}.clear`, callback);
    localStorage.removeItem(this.STORAGE_KEY);

    if (callback) {
      callback();
    }

    return Promise.resolve();
  }

  async getKeys(callback?: (keys: string[]) => void): Promise<string[]> {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const data = storedData !== null ? JSON.parse(storedData) as Record<string, unknown> : {};

    if (callback) {
      callback(Object.keys(data));
    }

    return Promise.resolve(Object.keys(data));
  }

  async setAccessLevel(...args: unknown[]): Promise<void> {
    console.error('Not implemented', args);

    return Promise.resolve();
  }

  async getBytesInUse(keys?: unknown, callback?: unknown): Promise<number> {
    console.error('Not implemented', keys, callback);

    return Promise.resolve(0);
  }
}

type NoInferX<T> = T[][T extends unknown ? 0 : never];
