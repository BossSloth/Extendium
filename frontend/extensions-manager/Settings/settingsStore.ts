import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  setSettings(settings: Partial<SettingsStore>): void;
  barMarginLeft: number;
  barMarginRight: number;
}

export const settingsStorageKey = 'extendium_settingsStore';

export const useSettingsStore = create<SettingsStore>()(persist(
  set =>
    ({
      barMarginLeft: 0,
      barMarginRight: 0,
      setSettings: (settings: SettingsStore): void => {
        set(state => ({ ...state, ...settings }));
      },
    }),
  {
    name: settingsStorageKey,
  },
));
