import { Extension } from './Extension';

export class Logger {
  constructor(readonly parent: Extension, readonly VERBOSE: boolean, readonly context: string) {
  }

  public log(type: string, ...args: unknown[]): void {
    if (this.VERBOSE) {
      console.debug(`[${this.parent.manifest.name}][${this.context}][${type}]:`, ...args);
    }
  }
}
