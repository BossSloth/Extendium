import { DialogButton, Toggle } from '@steambrew/client';
import { persistentExtensionsPage } from 'chrome/ChromeExtensionPageManager';
import { ExtensionInfo } from 'chrome/types';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { useExtensionsStore } from 'stores/extensionsStore';

export function ExtensionManagerComponent({ extension }: { readonly extension: ExtensionInfo; }): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const [isEnabled, setIsEnabled] = React.useState(extension.state === 'ENABLED');
  const { removeExtension } = useExtensionsStore();

  function handleToggleChange(value: boolean): void {
    persistentExtensionsPage.evaluateExpression(
      async (id: string, enabled: boolean) => chrome.management.setEnabled(id, enabled),
      [extension.id, value],
    );
    setIsEnabled(value);
  }

  async function uninstallExtension(): Promise<void> {
    await persistentExtensionsPage.evaluateExpression(
      async (id: string) => chrome.management.uninstall(id),
      [extension.id],
    );
    removeExtension(extension.id);
  }

  // const extensionHasErrors = extension.logger.errors.length > 0;

  return (
    <div className="extension-card">
      <div className="extension-main">
        <div className="icon" style={{ position: 'relative' }}>
          <img src={extension.iconUrl} />
          {/* {extensionHasErrors && (
            <FaExclamationCircle color="red" size={24} />
          )} */}
        </div>

        <div className="content">
          <div className="name-and-version layout-horizontal-center">
            <div className="name">{extension.name}</div>
            <span className="version secondary-text">{extension.version}</span>
          </div>
          <div className="description secondary-text">
            {extension.description}
          </div>
        </div>
      </div>
      <div className="extension-buttons">
        <DialogButton onClick={() => { setManagerPopup({ route: `info/${extension.name}` }); }}>Details</DialogButton>
        <DialogButton onClick={() => { uninstallExtension(); }}>Remove</DialogButton>
        <Toggle onChange={handleToggleChange} value={isEnabled} />
      </div>
    </div>
  );
}
