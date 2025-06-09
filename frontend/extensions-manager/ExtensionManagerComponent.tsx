import { Extension } from '@extension/Extension';
import { DialogButton, Toggle } from '@steambrew/client';
import React from 'react';

export function ExtensionManagerComponent({ extension }: { readonly extension: Extension; }): React.ReactNode {
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
        <DialogButton>Details</DialogButton>
        <DialogButton>Remove</DialogButton>
        <Toggle value />
      </div>
    </div>
  );
}
