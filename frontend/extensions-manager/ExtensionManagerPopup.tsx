import { routerHook } from '@steambrew/client';
import { EUIMode } from '@steambrew/client/build/globals/steam-client/shared';
import { SteamDialog } from 'components/SteamComponents';
import { usePopupsOpenStore } from 'components/stores/popupsOpenStore';
import { Styles } from 'components/Styles';
import { default as React } from 'react';
import { mainWindow } from 'shared';
import { ExtensionDetailInfo } from './ExtensionDetailInfo';
import { ExtensionManagerRoot } from './ExtensionManagerRoot';

export function ExtensionManagerPopup(): React.ReactNode {
  const { managerPopupOpen, setManagerPopupOpen } = usePopupsOpenStore();
  const [extensionDetailRoute, setExtensionDetailRoute] = React.useState<string | null>(null);

  if (!managerPopupOpen) {
    return null;
  }

  return (
    <SteamDialog
      strTitle="Extensions"
      onDismiss={() => { setManagerPopupOpen(false); }}
      popupWidth={mainWindow.innerWidth * 0.75}
      popupHeight={mainWindow.innerHeight * 0.65}
      minWidth={880}
      minHeight={370}
      resizable
      saveDimensionsKey="extensionManagerPopup"
    >
      <Styles />
      <div className="extension-manager-popup">
        {extensionDetailRoute !== null
          ? (
              <ExtensionDetailInfo extension={extensions.get(extensionDetailRoute)} setExtensionDetailRoute={setExtensionDetailRoute} />
            )
          : (
              <ExtensionManagerRoot setExtensionDetailRoute={setExtensionDetailRoute} />
            )}
      </div>
    </SteamDialog>
  );
}

routerHook.addGlobalComponent('ExtensionManagerPopup', () => <ExtensionManagerPopup />, EUIMode.Desktop);

export function openExtensionManagerPopup(): void {
  const state = usePopupsOpenStore.getState();

  state.setManagerPopupOpen(false);
  setTimeout(() => {
    state.setManagerPopupOpen(true);
  }, 1);
}
