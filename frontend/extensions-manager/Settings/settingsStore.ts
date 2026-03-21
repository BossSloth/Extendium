import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UpdateSettings } from '../../callables';

interface SettingsStore {
  setSettings(settings: Partial<SettingsStore>): void;
  barMarginLeft: number;
  barMarginRight: number;
  openLinksInCurrentTab: boolean;
  showCompatibilityPills: boolean;
}

const settingsStorageKey = 'extendium_settingsStore';

export const useSettingsStore = create<SettingsStore>()(persist(
  set =>
    ({
      barMarginLeft: 0,
      barMarginRight: 0,
      showCompatibilityPills: true,
      openLinksInCurrentTab: false,
      setSettings: (settings: SettingsStore): void => {
        set((state) => {
          const newState = { ...state, ...settings };
          if (newState.openLinksInCurrentTab !== state.openLinksInCurrentTab) {
            UpdateSettings({ settings: JSON.stringify({ openLinksInCurrentTab: newState.openLinksInCurrentTab }) });
          }

          return newState;
        });
      },
    }),
  {
    name: settingsStorageKey,
  },
));
