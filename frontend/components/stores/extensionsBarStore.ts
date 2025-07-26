import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExtensionsBarStore {
  setExtensionsOrder(order: string[] | ((order: string[]) => string[])): void;
  extensionsOrder: string[];
}

export const extensionBarStorageKey = 'extendium_extensionsBarStore';

export const useExtensionsBarStore = create<ExtensionsBarStore>()(persist(
  set =>
    ({
      extensionsOrder: [],
      setExtensionsOrder: (order): void => {
        set(state => ({
          extensionsOrder: typeof order === 'function' ? order(state.extensionsOrder) : order,
        }));
      },
    }),
  {
    name: extensionBarStorageKey,
  },
));
