import { callable, DialogButton } from '@steambrew/client';
import { DialogControlSectionClass, settingsClasses } from 'classes';
import React from 'react';
import { FaFolderOpen, FaStore } from 'react-icons/fa';
import { ExtensionManagerComponent } from './ExtensionManagerComponent';
import { showInstallExtensionModal } from './InstallExtensionModal';

const GetExtensionsDir = callable<[], string>('GetExtensionsDir');

export function ExtensionManagerRoot(): React.ReactNode {
  async function openExtensionsFolder(): Promise<void> {
    const extensionsDir = await GetExtensionsDir();
    SteamClient.System.OpenLocalDirectoryInSystemExplorer(extensionsDir);
  }

  return (
    <>
      <div className={`${DialogControlSectionClass}`}>
        {/* <DialogButton className={`span-icon ${settingsClasses.SettingsDialogButton}`}>
            <FaSave />
            Save
          </DialogButton> */}
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
    </>
  );
}
