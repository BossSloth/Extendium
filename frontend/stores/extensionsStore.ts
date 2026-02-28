import { Extension } from '@extension/Extension';
import { create } from 'zustand';

interface ExtensionsStore {
  addExtension(extension: Extension): void;
  removeExtension(id: string): void;
  extensions: Map<string, Extension>;
}

export const useExtensionsStore = create<ExtensionsStore>()(set => ({
  extensions: new Map(),
  addExtension: (extension: Extension): void => {
    set((state) => {
      const newExtensions = new Map(state.extensions);
      newExtensions.set(extension.id, extension);

      return { extensions: newExtensions };
    });
  },
  removeExtension: (id: string): void => {
    set((state) => {
      const newExtensions = new Map(state.extensions);
      newExtensions.delete(id);

      return { extensions: newExtensions };
    });
  },
}));

// @ts-expect-error globalThis
window.extensions = useExtensionsStore;
