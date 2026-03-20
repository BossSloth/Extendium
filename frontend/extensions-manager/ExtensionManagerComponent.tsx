import { Extension } from '@extension/Extension';
import { DialogButton, Toggle } from '@steambrew/client';
import { persistentExtensionsPage, uninstallExtension } from 'chrome/ChromeExtensionPageManager';
import { usePopupsStore } from 'components/stores/popupsStore';
import { COMPATIBILITY_LIST_URL } from 'constant';
import React from 'react';
import { useExtensionsStore } from 'stores/extensionsStore';
import { getExtensionCompatibility, type CompatibilityStatus } from '../extensionCompatibility';
import { useSettingsStore } from '../extensions-manager/Settings/settingsStore';

export function ExtensionManagerComponent({ extension }: { readonly extension: Extension; }): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const { removeExtension, setExtension } = useExtensionsStore();
  const { showCompatibilityPills } = useSettingsStore();
  const compatibility = getExtensionCompatibility(extension.id);

  function handleToggleChange(value: boolean): void {
    persistentExtensionsPage.evaluateExpression(
      async (id: string, enabled: boolean) => chrome.management.setEnabled(id, enabled),
      [extension.id, value],
    );
    extension.extensionInfo.state = value ? 'ENABLED' : 'DISABLED';
    setExtension(extension);
  }

  async function fullyUninstallExtension(): Promise<void> {
    await uninstallExtension(extension.id);
    removeExtension(extension.id);
  }

  function getCompatibilityColor(status: CompatibilityStatus | undefined): string {
    switch (status) {
      case 'Perfect': return '#2196f3';
      case 'Great': return '#4caf50';
      case 'Okay': return '#ff9800';
      case 'Broken': return '#f44336';
      case undefined: return '#9e9e9e';
      default: return '#9e9e9e';
    }
  }

  // const extensionHasErrors = extension.logger.errors.length > 0;

  return (
    <div className="extension-card">
      <div className="extension-main">
        <div className="icon" style={{ position: 'relative' }}>
          <img src={extension.action.iconUrl} />
          {/* {extensionHasErrors && (
            <FaExclamationCircle color="red" size={24} />
          )} */}
        </div>

        <div className="content">
          <div className="name-and-version">
            <div className="name">{extension.name}</div>
            <span className="version secondary-text">{extension.version}</span>
            {showCompatibilityPills && compatibility && (
              <span
                className="compatibility-pill"
                style={{ backgroundColor: getCompatibilityColor(compatibility) }}
                title={`Compatibility: ${compatibility}, click for compatibility list`}
                onClick={() => { SteamClient.System.OpenInSystemBrowser(COMPATIBILITY_LIST_URL); }}
              >
                {compatibility}
              </span>
            )}
          </div>
          <div className="description secondary-text">
            {extension.description}
          </div>
        </div>
      </div>
      <div className="extension-buttons">
        <DialogButton onClick={() => { setManagerPopup({ route: `info/${extension.id}` }); }}>Details</DialogButton>
        <DialogButton onClick={() => { fullyUninstallExtension(); }}>Remove</DialogButton>
        <Toggle onChange={handleToggleChange} value={extension.enabled} />
      </div>
    </div>
  );
}
