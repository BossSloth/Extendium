import { create } from 'zustand';

interface PopupsOpenStore {
  setManagerPopupOpen(open: boolean): void;
  managerPopupOpen: boolean;
}

export const usePopupsOpenStore = create<PopupsOpenStore>()(set =>
  ({
    managerPopupOpen: false,
    setManagerPopupOpen: (open): void => { set({ managerPopupOpen: open }); },
  }));
