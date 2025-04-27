/* eslint-disable @typescript-eslint/class-methods-use-this */

export class ChromeEvent<T extends (...args: never) => unknown = () => void> implements chrome.events.Event<T> {
  private listeners: T[] = [];

  addListener(callback: T): void {
    this.listeners.push(callback);
  }

  removeListener(callback: T): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  hasListener(callback: T): boolean {
    return this.listeners.includes(callback);
  }

  hasListeners(): boolean {
    return this.listeners.length > 0;
  }

  // #region TODO: not implemented
  addRules(...args: unknown[]): void {
    console.error('Not implemented', args);
  }

  removeRules(...args: unknown[]): void {
    console.error('Not implemented', args);
  }

  getRules(...args: unknown[]): void {
    console.error('Not implemented', args);
  }
  // #endregion

  getListenersSnapshot(): readonly T[] {
    return [...this.listeners];
  }

  emit(...args: Parameters<T>): void {
    for (const listener of this.listeners) {
      // @ts-expect-error we can pass the args
      listener(...args);
    }
  }
}
