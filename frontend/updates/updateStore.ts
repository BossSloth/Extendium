import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UpdateStore {
  setUpdateStore(data: Partial<UpdateStore>): void;
  /** Date string */
  lastChecked: string;
  updateAvailable: string[];
}

export const updateStorageKey = 'extendium_updateStore';

export const useUpdateStore = create<UpdateStore>()(persist(
  set =>
    ({
      lastChecked: new Date(0).toJSON(),
      updateAvailable: [],
      setUpdateStore: (data: Partial<UpdateStore>): void => {
        set(state => ({ ...state, ...data }));
      },
    }),
  {
    name: updateStorageKey,
  },
));
