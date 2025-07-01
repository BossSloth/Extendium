import { routerHook } from '@steambrew/client';
import { EUIMode } from '@steambrew/client/build/globals/steam-client/shared';
import { SteamDialog } from 'components/SteamComponents';
import { usePopupsStore } from 'components/stores/popupsStore';
import { Styles } from 'components/Styles';
import { default as React } from 'react';
import { mainWindow } from 'shared';
import { ExtensionDetailInfo } from './ExtensionDetailInfo';
import { ExtensionManagerRoot } from './ExtensionManagerRoot';

export function ExtensionManagerPopup(): React.ReactNode {
  const { managerPopup, setManagerPopup } = usePopupsStore();
  // const [extensionDetailRoute, setExtensionDetailRoute] = React.useState<string | null>(null);

  if (!managerPopup.open) {
    return null;
  }

  return (
    <SteamDialog
      strTitle="Extensions"
      onDismiss={() => { setManagerPopup({ open: false }); }}
      popupWidth={mainWindow.innerWidth * 0.75}
      popupHeight={mainWindow.innerHeight * 0.65}
      minWidth={1280}
      minHeight={370}
      resizable
      saveDimensionsKey="extensionManagerPopup"
    >
      <Styles />
      <div className="extension-manager-popup">
        {managerPopup.route !== null
          ? (
              <ExtensionDetailInfo extension={extensions.get(managerPopup.route)} />
            )
          : (
              <ExtensionManagerRoot />
            )}
      </div>
    </SteamDialog>
  );
}

routerHook.addGlobalComponent('ExtensionManagerPopup', () => <ExtensionManagerPopup />, EUIMode.Desktop);

export function openExtensionManagerPopup(route: string | null = null): void {
  const state = usePopupsStore.getState();

  state.setManagerPopup({ open: false });
  setTimeout(() => {
    state.setManagerPopup({ open: true, route });
  }, 1);
}
