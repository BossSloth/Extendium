/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Extension } from './Extension';
import { Logger } from './Logger';

export type AreaName = 'local' | 'sync' | 'managed' | 'session';

export class Storage {
  public readonly QUOTA_BYTES: number; // Example: local = 5MB, sync = 100KB

  private readonly STORAGE_KEY: string;

  constructor(readonly extension: Extension, readonly area: AreaName, readonly logger: Logger) {
    this.STORAGE_KEY = `${this.extension.manifest.name}::${this.area}`;

    if (this.area === 'local') {
      this.QUOTA_BYTES = 5 * 1024 * 1024; // 5MB
    } else if (this.area === 'sync') {
      this.QUOTA_BYTES = 100 * 1024; // 100KB
    } else {
      this.QUOTA_BYTES = 1024; // 1KB
    }
  }

  async get(keys: string | string[] | Record<string, unknown> | null | undefined, callback?: (items: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
    this.logger.log(`storage.${this.area}.get`, keys, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    let result: Record<string, unknown> = {};
    let keysToRetrieve: string[] = [];

    if (storedData === null) {
      return Promise.resolve(result);
    }

    const data = JSON.parse(storedData) as Record<string, unknown>;

    if (keys === null || keys === undefined) {
      result = data;
    } else if (typeof keys === 'string') {
      keysToRetrieve = [keys];
    } else if (Array.isArray(keys)) {
      keysToRetrieve = keys;
    } else {
      keysToRetrieve = Object.keys(keys);
    }

    for (const key of keysToRetrieve) {
      result[key] = data[key];
    }

    if (callback) {
      callback(result);
    }

    return Promise.resolve(result);
  }

  async set(items: Record<string, unknown>, callback?: () => void): Promise<void> {
    this.logger.log(`storage.${this.area}.set`, items, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const data = storedData !== null ? JSON.parse(storedData) as Record<string, unknown> : {};

    Object.assign(data, items);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

    if (callback) {
      callback();
    }

    return Promise.resolve();
  }

  async remove(keys: string | string[], callback?: () => void): Promise<void> {
    this.logger.log(`storage.${this.area}.remove`, keys, callback);
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    const data = storedData !== null ? JSON.parse(storedData) as Record<string, unknown> : {};

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
}
