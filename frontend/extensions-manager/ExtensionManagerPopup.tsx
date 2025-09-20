import { routerHook } from '@steambrew/client';
import { EUIMode } from '@steambrew/client/build/globals/steam-client/shared';
import { SteamDialog } from 'components/SteamComponents';
import { usePopupsStore } from 'components/stores/popupsStore';
import { Styles } from 'components/Styles';
import { default as React } from 'react';
import { mainWindow } from 'shared';
import { ExtensionDetailInfo } from './ExtensionDetailInfo';
import { ExtensionManagerRoot } from './ExtensionManagerRoot';
import { ExtendiumSettings } from './Settings/ExtendiumSettings';
import { StorageManager } from './Storage/StorageManager';

export function ExtensionManagerPopup(): React.ReactNode {
  const { managerPopup, setManagerPopup } = usePopupsStore();

  if (!managerPopup.open) {
    return null;
  }

  let content: React.ReactNode;

  if (managerPopup.route === null) {
    content = <ExtensionManagerRoot />;
  } else if (managerPopup.route.startsWith('info/')) {
    content = <ExtensionDetailInfo extension={extensions.get(managerPopup.route.split('/').pop() ?? '')} />;
  } else if (managerPopup.route.startsWith('storage')) {
    content = <StorageManager />;
  } else if (managerPopup.route.startsWith('settings')) {
    content = <ExtendiumSettings />;
  } else {
    content = <p>Error you somehow got to an undefined route please report this with this route &quot;<code>{managerPopup.route}</code>&quot;</p>;
  }

  return (
    <SteamDialog
      strTitle="Extensions"
      onDismiss={() => { setManagerPopup({ open: false }); }}
      popupWidth={1280}
      popupHeight={mainWindow.innerHeight * 0.65}
      minWidth={1280}
      minHeight={370}
      resizable
      saveDimensionsKey="extensionManagerPopup"
    >
      <Styles />
      <div className="extension-manager-popup">
        {content}
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
