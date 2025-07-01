import { Extension } from '@extension/Extension';
import { DialogButton, Field } from '@steambrew/client';
import { openExtensionManagerPopup } from 'extensions-manager/ExtensionManagerPopup';
import React from 'react';
import { FaCog } from 'react-icons/fa';
import { LuPin, LuPinOff } from 'react-icons/lu';

export function ManagerExtensionItem({ extension, pinned, pinExtension, unpinExtension }:
{ readonly extension: Extension; readonly pinned: boolean; pinExtension(extensionId: string): void; unpinExtension(extensionId: string): void; }): React.JSX.Element {
  function handlePin(): void {
    if (pinned) {
      unpinExtension(extension.getName());
    } else {
      pinExtension(extension.getName());
    }
  }

  return (
    <Field
      key={extension.getName()}
      label={extension.getName()}
      icon={<img width={16} height={16} src={extension.action.getDefaultIconUrl() ?? ''} alt={extension.manifest.name} />}
      padding="standard"
    >
      <DialogButton onClick={handlePin} style={{ padding: '0 8px' }} title={pinned ? 'Unpin' : 'Pin'}>
        {pinned ? <LuPinOff color="lightblue" /> : <LuPin />}
      </DialogButton>
      <DialogButton onClick={() => { openExtensionManagerPopup(extension.getName()); }} style={{ padding: '0 8px' }} title="Manage">
        <FaCog />
      </DialogButton>
    </Field>
  );
}
