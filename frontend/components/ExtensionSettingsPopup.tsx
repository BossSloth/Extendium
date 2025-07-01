import { routerHook } from '@steambrew/client';
import { EUIMode } from '@steambrew/client/build/globals/steam-client/shared';
import React from 'react';
import { mainWindow } from 'shared';
import { SteamDialog } from './SteamComponents';
import { usePopupsStore } from './stores/popupsStore';

export function ExtensionSettingsPopup(): React.ReactNode {
  const { settingsPopup, setSettingsPopup } = usePopupsStore();

  if (!settingsPopup.open) {
    return null;
  }

  return (
    <SteamDialog
      strTitle={settingsPopup.title}
      onDismiss={() => { setSettingsPopup({ open: false }); }}
      popupWidth={mainWindow.innerWidth / 2}
      popupHeight={mainWindow.innerHeight / 2}
      resizable
      saveDimensionsKey={`extensionSettingsPopup_${settingsPopup.title.replace(/\s/g, '_')}`}
    >
      {settingsPopup.content}
    </SteamDialog>
  );
}

routerHook.addGlobalComponent('ExtensionSettingsPopup', () => <ExtensionSettingsPopup />, EUIMode.Desktop);

export function openExtensionSettingsPopup(content: React.ReactNode, title: string): void {
  const state = usePopupsStore.getState();

  state.setSettingsPopup({ open: false });
  setTimeout(() => {
    state.setSettingsPopup({ content, open: true, title });
  }, 1);
}
