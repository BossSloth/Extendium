/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ModalRoot, modules } from '@steambrew/client';
import React, { FC } from 'react';

// If this get's rendered inside a steam context then this will show a really good popup that is customizable and also resizable.
// TODO: find a way to render this consistently in the steam context. Rendering it in our own components does not work.
export const SteamPopup = modules.get('78110').w as FC<any>; // Can be refound by searching e.resizable

export function RandomPopup({ onClose }: { onClose?(): void; }): React.JSX.Element {
  return (
    <SteamPopup
      strTitle="Random Popup"
      onDismiss={onClose}
      onCancel={() => { console.log('cancel'); }}
      closeModal={onClose}
      popupWidth={400}
      popupHeight={400}
      resizable
      modal={false}
    >
      <ModalRoot>
        <span>Random Popup</span>
      </ModalRoot>
    </SteamPopup>
  );
}
