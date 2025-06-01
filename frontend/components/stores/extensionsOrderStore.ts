import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrderStore {
  setExtensionsOrder(order: string[] | ((order: string[]) => string[])): void;
  extensionsOrder: string[];
}

const storageKey = 'extendium_extensionsOrder';

export const useExtensionsOrderStore = create<OrderStore>()(persist(
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
    name: storageKey,
  },
));
