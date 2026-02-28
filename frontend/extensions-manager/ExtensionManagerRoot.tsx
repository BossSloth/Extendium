import { DialogButton } from '@steambrew/client';
import { settingsClasses } from 'classes';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { FaCog, FaDatabase, FaStore } from 'react-icons/fa';
import { useExtensionsStore } from 'stores/extensionsStore';
import { ExtensionManagerComponent } from './ExtensionManagerComponent';
import { showInstallExtensionModal } from './InstallExtensionModal';

// const GetExtensionsDir = callable<[], string>('GetExtensionsDir');

export function ExtensionManagerRoot(): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const { extensions } = useExtensionsStore();

  // async function openExtensionsFolder(): Promise<void> {
  //   const extensionsDir = await GetExtensionsDir();
  //   SteamClient.System.OpenLocalDirectoryInSystemExplorer(extensionsDir);
  // }

  return (
    <>
      <div className="root-buttons">
        <DialogButton
          onClick={() => { setManagerPopup({ route: 'storage' }); }}
          className={`span-icon ${settingsClasses.SettingsDialogButton}`}
        >
          <FaDatabase />
          Manage storage
        </DialogButton>
        <DialogButton
          onClick={showInstallExtensionModal}
          className={`span-icon ${settingsClasses.SettingsDialogButton}`}
        >
          <FaStore />
          Install extension
        </DialogButton>
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* <DialogButton
            onClick={openExtensionsFolder}
            className={`span-icon ${settingsClasses.SettingsDialogButton}`}
          >
            <FaFolderOpen />
            Browse local files
          </DialogButton> */}
          <DialogButton
            onClick={() => { setManagerPopup({ route: 'settings' }); }}
            className={`span-icon ${settingsClasses.SettingsDialogButton}`}
            style={{ width: '40px', minWidth: 'unset' }}
          >
            <FaCog />
          </DialogButton>
        </div>
      </div>
      <div className="card-container">
        {Array.from(extensions.values())
          .sort((a, b) => {
            // First sort by enabled state (enabled first)
            // const aEnabled = a.state === 'ENABLED';
            // const bEnabled = b.state === 'ENABLED';
            // if (aEnabled !== bEnabled) {
            //   return aEnabled ? -1 : 1;
            // }

            // Then sort alphabetically by name
            return a.name.localeCompare(b.name);
          })
          .map(extension => (
            <ExtensionManagerComponent key={extension.id} extension={extension} />
          ))}
      </div>
    </>
  );
}
