import { Extension } from '@extension/Extension';
import { callable, DialogButton, Toggle } from '@steambrew/client';
import React from 'react';
import { showRemoveModal } from './RemoveModal';

const ToggleExtension = callable<[{ name: string; enabled: boolean; }], void>('ToggleExtension');

export function ExtensionManagerComponent({ extension, setExtensionDetailRoute }: { readonly extension: Extension; setExtensionDetailRoute(route: string | null): void; }): React.ReactNode {
  function handleToggleChange(value: boolean): void {
    ToggleExtension({ name: extension.folderName, enabled: value });
    // TODO: make work
  }

  return (
    <div className="extension-card">
      <div className="extension-main">
        <div className="icon">
          <img src={extension.action.getDefaultIconUrl()} />
        </div>

        <div className="content">
          <div className="name-and-version layout-horizontal-center">
            <div className="name">{extension.getName()}</div>
            <span className="version secondary-text">{extension.getVersion()}</span>
          </div>
          <div className="description secondary-text">
            {extension.getDescription() ?? 'No description...'}
          </div>
        </div>
      </div>
      <div className="extension-buttons">
        <DialogButton onClick={() => { setExtensionDetailRoute(extension.manifest.name); }}>Details</DialogButton>
        <DialogButton onClick={() => { showRemoveModal(extension); }}>Remove</DialogButton>
        <Toggle onChange={handleToggleChange} value />
      </div>
    </div>
  );
}
