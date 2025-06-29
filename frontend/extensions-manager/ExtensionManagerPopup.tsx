import { callable, DialogButton, routerHook } from '@steambrew/client';
import { EUIMode } from '@steambrew/client/build/globals/steam-client/shared';
import { DialogControlSectionClass, settingsClasses } from 'classes';
import { SteamDialog } from 'components/SteamComponents';
import { usePopupsOpenStore } from 'components/stores/popupsOpenStore';
import { Styles } from 'components/Styles';
import { default as React } from 'react';
import { FaFolderOpen, FaSave, FaStore } from 'react-icons/fa';
import { mainWindow } from 'shared';
import { ExtensionManagerComponent } from './ExtensionManagerComponent';
import { showInstallExtensionModal } from './InstallExtensionModal';

const GetExtensionsDir = callable<[], string>('GetExtensionsDir');

export function ExtensionManagerPopup(): React.ReactNode {
  const { managerPopupOpen, setManagerPopupOpen } = usePopupsOpenStore();

  if (!managerPopupOpen) {
    return null;
  }

  async function openExtensionsFolder(): Promise<void> {
    const extensionsDir = await GetExtensionsDir();
    SteamClient.System.OpenLocalDirectoryInSystemExplorer(extensionsDir);
  }

  return (
    <SteamDialog
      strTitle="Extensions"
      onDismiss={() => { setManagerPopupOpen(false); }}
      popupWidth={mainWindow.innerWidth * 0.75}
      popupHeight={mainWindow.innerHeight * 0.65}
      resizable
      saveDimensionsKey="extensionManagerPopup"
    >
      <div className="extension-manager-popup">
        <Styles />
        <div className={`${DialogControlSectionClass}`}>
          <DialogButton className={`span-icon ${settingsClasses.SettingsDialogButton}`}>
            <FaSave />
            Save
          </DialogButton>
          <DialogButton
            onClick={showInstallExtensionModal}
            className={`span-icon ${settingsClasses.SettingsDialogButton}`}
          >
            <FaStore />
            Install extension
          </DialogButton>
          <DialogButton
            onClick={openExtensionsFolder}
            className={`span-icon ${settingsClasses.SettingsDialogButton}`}
          >
            <FaFolderOpen />
            Browse local files
          </DialogButton>
        </div>
        <div className="card-container">
          {[...extensions.values()].map(extension => (
            <ExtensionManagerComponent key={extension.getName()} extension={extension} />
          ))}
        </div>
      </div>
    </SteamDialog>
  );
}

routerHook.addGlobalComponent('ExtensionManagerPopup', () => <ExtensionManagerPopup />, EUIMode.Desktop);

export function openExtensionManagerPopup(): void {
  const state = usePopupsOpenStore.getState();

  state.setManagerPopupOpen(true);
}
