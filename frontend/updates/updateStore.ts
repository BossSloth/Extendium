import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UpdateStore {
  addLastVersion(extensionName: string, version: string): void;
  setUpdateStore(data: Partial<UpdateStore>): void;
  /** Date string */
  lastChecked: string;
  lastVersions: Record<string, string>;
  updateAvailable: string[];
}

export const updateStorageKey = 'extendium_updateStore';

export const useUpdateStore = create<UpdateStore>()(persist(
  set =>
    ({
      lastChecked: new Date(0).toJSON(),
      lastVersions: {},
      updateAvailable: [],
      setUpdateStore: (data: Partial<UpdateStore>): void => {
        set(state => ({ ...state, ...data }));
      },
      addLastVersion: (extensionName: string, version: string): void => {
        set(state => ({ ...state, lastVersions: { ...state.lastVersions, [extensionName]: version } }));
      },
    }),
  {
    name: updateStorageKey,
  },
));
