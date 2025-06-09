import { Extension } from '@extension/Extension';
import { DialogButton, Field } from '@steambrew/client';
import React from 'react';
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
      <DialogButton onClick={handlePin}>
        {pinned ? <LuPin /> : <LuPinOff />}
      </DialogButton>
    </Field>
  );
}
