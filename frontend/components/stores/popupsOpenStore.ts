/* eslint-disable perfectionist/sort-interfaces */
/* eslint-disable @typescript-eslint/member-ordering */
import { create } from 'zustand';

interface PopupsOpenStore {
  managerPopupOpen: boolean;
  setManagerPopupOpen(open: boolean): void;

  settingsPopup: SettingsPopupProps;
  setSettingsPopup(popup: Partial<SettingsPopupProps>): void;
}

interface SettingsPopupProps {
  open: boolean;
  content: React.ReactNode;
  title: string;
}

export const usePopupsOpenStore = create<PopupsOpenStore>()(set =>
  ({
    managerPopupOpen: false,
    setManagerPopupOpen: (open): void => { set({ managerPopupOpen: open }); },

    settingsPopup: {
      open: false,
      content: null,
      title: '',
    },
    setSettingsPopup: (popup): void => {
      set(state => ({ settingsPopup: { ...state.settingsPopup, ...popup } }));
    },
  }));
