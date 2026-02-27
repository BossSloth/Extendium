import { ExtensionInfo } from 'chrome/types';
import { create } from 'zustand';

interface ExtensionsStore {
  addExtension(extension: ExtensionInfo): void;
  removeExtension(id: string): void;
  extensions: Map<string, ExtensionInfo>;
}

export const useExtensionsStore = create<ExtensionsStore>()(set => ({
  extensions: new Map(),
  addExtension: (extension: ExtensionInfo): void => {
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
