import { Extension } from './Extension';

export class Logger {
  public readonly errors: string[] = [];

  constructor(readonly parent: Extension, readonly VERBOSE: boolean, readonly context: string) {
  }

  public log(type: string, ...args: unknown[]): void {
    if (this.VERBOSE) {
      console.debug(`[${this.parent.getName()}][${this.context}][${type}]:`, ...args);
    }
  }

  public error(type: string, ...args: unknown[]): void {
    console.error(`[${this.parent.getName()}][${this.context}][${type}]:`, ...args);
    this.errors.push(`[${this.context}][${type}]: ${args.join(' ')}`);
  }
}
