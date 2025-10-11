/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/class-methods-use-this */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { ChromeEvent } from './ChromeEvent';
import { EnumerableMethods } from './EnumerableMethods';
import { Extension } from './Extension';
import { Logger } from './Logger';

@EnumerableMethods
export class Storage implements chrome.storage.StorageArea {
  public readonly QUOTA_BYTES: number; // Example: local = 5MB, sync = 100KB

  public readonly onChanged = new ChromeEvent<(changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => void>();

  private readonly STORAGE_KEY: string;

  readonly #extension: Extension;

  readonly #logger: Logger;

  constructor(extension: Extension, readonly area: chrome.storage.AreaName, logger: Logger) {
    this.#extension = extension;
    this.#logger = logger;
    this.STORAGE_KEY = `${this.#extension.getName()}::${this.area}`;

    if (this.area === 'local') {
      this.QUOTA_BYTES = 5 * 1024 * 1024; // 5MB
    } else if (this.area === 'sync') {
      this.QUOTA_BYTES = 100 * 1024; // 100KB
    } else {
      this.QUOTA_BYTES = 1024; // 1KB
    }
  }

  async get<T = Record<string, unknown>>(
    keys?: NoInferX<keyof T> | NoInferX<keyof T>[] | Partial<NoInferX<T>> | null | ((items: T) => void),
    callback?: (items: T) => void,
  ): Promise<T> {
    this.#logger.log(`storage.${this.area}.get`, keys, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    let result: Record<string, unknown> = {};
    let keysToRetrieve: string[] = [];

    if (storedData === null) {
      if (keys !== null && typeof keys === 'object') {
        result = keys as Record<string, unknown>;
      }

      if (callback) {
        callback(result as T);
      }

      return Promise.resolve(result as T);
    }

    const data = JSON.parse(storedData) as Record<string, unknown>;

    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }

    if (keys === null || keys === undefined) {
      result = { ...data };
    } else if (typeof keys === 'string') {
      keysToRetrieve = [keys];
    } else if (Array.isArray(keys)) {
      keysToRetrieve = keys.map(key => String(key));
    } else {
      keysToRetrieve = Object.keys(keys);
    }

    for (const key of keysToRetrieve) {
      if (key in data) {
        result[key] = data[key];
      } else if (keys !== null && typeof keys === 'object' && key in keys) {
        result[key] = (keys as Record<string, unknown>)[key];
      }
    }

    if (callback) {
      callback(result as T);
    }

    return Promise.resolve(result as T);
  }

  async set(items: Record<string, unknown>, callback?: () => void): Promise<void> {
    this.#logger.log(`storage.${this.area}.set`, items, callback);
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

    this.#extension.onStorageChanged.emit(changes, this.area);
    this.onChanged.emit(changes, this.area);

    return Promise.resolve();
  }

  async remove(keys: string | string[], callback?: () => void): Promise<void> {
    this.#logger.log(`storage.${this.area}.remove`, keys, callback);
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

    this.#extension.onStorageChanged.emit(changes, this.area);
    this.onChanged.emit(changes, this.area);

    return Promise.resolve();
  }

  async clear(callback?: () => void): Promise<void> {
    this.#logger.log(`storage.${this.area}.clear`, callback);
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

export class SyncStorage extends Storage implements chrome.storage.SyncStorageArea {
  // Fake values
  public readonly QUOTA_BYTES_PER_ITEM = 8192;
  public readonly MAX_ITEMS = 512;
  public readonly MAX_WRITE_OPERATIONS_PER_HOUR = 10000;
  public readonly MAX_WRITE_OPERATIONS_PER_MINUTE = 200;
  public readonly MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE = 10;
  public readonly MAX_SUSTAINED_READ_OPERATIONS_PER_MINUTE = 10;

  constructor(extension: Extension, logger: Logger) {
    super(extension, 'sync', logger);
  }
}
