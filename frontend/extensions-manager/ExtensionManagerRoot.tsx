import { DialogButton } from '@steambrew/client';
import { OpenTargetPage } from 'chrome/ChromePageManager';
import { settingsClasses } from 'classes';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { FaCog, FaStore } from 'react-icons/fa';
import { IoExtensionPuzzle } from 'react-icons/io5';
import { useExtensionsStore } from 'stores/extensionsStore';
import { ExtensionManagerComponent } from './ExtensionManagerComponent';

export function ExtensionManagerRoot(): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const { extensions } = useExtensionsStore();

  return (
    <>
      <div className="root-buttons">
        <DialogButton
          onClick={() => { OpenTargetPage('https://chromewebstore.google.com/'); }}
          className={`span-icon ${settingsClasses.SettingsDialogButton}`}
        >
          <FaStore />
          Install extension
        </DialogButton>
        <DialogButton
          onClick={() => { OpenTargetPage('chrome://extensions'); }}
          className={`span-icon ${settingsClasses.SettingsDialogButton}`}
        >
          <IoExtensionPuzzle />
          Advanced extension management
        </DialogButton>
        <div style={{ display: 'flex', gap: '6px' }}>
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
