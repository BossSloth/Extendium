/* eslint-disable perfectionist/sort-interfaces */
/* eslint-disable @typescript-eslint/member-ordering */
import { create } from 'zustand';

interface PopupsStore {
  managerPopup: ManagerPopupProps;
  setManagerPopup(popup: Partial<ManagerPopupProps>): void;

  settingsPopup: SettingsPopupProps;
  setSettingsPopup(popup: Partial<SettingsPopupProps>): void;
}

interface ManagerPopupProps {
  open: boolean;
  route: string | null;
}

interface SettingsPopupProps {
  open: boolean;
  content: React.ReactNode;
  title: string;
}

export const usePopupsStore = create<PopupsStore>()(set =>
  ({
    managerPopup: {
      open: false,
      route: null,
    },
    setManagerPopup: (popup): void => {
      set(state => ({ managerPopup: { ...state.managerPopup, ...popup } }));
    },

    settingsPopup: {
      open: false,
      content: null,
      title: '',
    },
    setSettingsPopup: (popup): void => {
      set(state => ({ settingsPopup: { ...state.settingsPopup, ...popup } }));
    },
  }));
