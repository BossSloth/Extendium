import { Extension } from '@extension/Extension';

export class ExtensionWrapper {
  constructor(readonly extension: Extension, readonly chrome: typeof window.chrome) { }
}
