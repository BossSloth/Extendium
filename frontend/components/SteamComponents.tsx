/* eslint-disable perfectionist/sort-interfaces */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { findModuleExport, ModalRoot } from '@steambrew/client';
import React from 'react';

interface GenericDialogProps {
  /**
   * The title of the dialog.
   */
  readonly strTitle: string;
  readonly strName?: string;
  /**
   * The callback function to be called when the dialog is dismissed.
   */
  onDismiss(): void;
  /**
   * The width of the dialog.
   */
  readonly popupWidth?: number;
  /**
   * The height of the dialog.
   */
  readonly popupHeight?: number;
  readonly minWidth?: number;
  readonly minHeight?: number;
  /**
   * Whether the dialog is resizable.
   */
  readonly resizable?: boolean;

  readonly fullscreen?: boolean;
  /**
   * Whether the dialog will be a modal (embedded within the client and not movable) or a popup (movable and resizable).
   * You should always set this to false.
   *
   * @default false
   */
  readonly modal?: boolean;
  /**
   * TODO: unknown
   */
  readonly onlyPopoutIfNeeded?: boolean;

  readonly refPopup?: React.RefObject<HTMLDivElement>;

  readonly titleBarClassName?: string;

  /**
   * key used in localStorage to save the dimensions of the popup
   * @note window will always be centered but resized to the dimensions saved in localStorage
   */
  readonly saveDimensionsKey?: string;

  /**
   * TODO: unknown
   */
  readonly browserType?: unknown;
}

const GenericDialog = findModuleExport(e =>
  e?.toString?.()?.includes('.popupHeight') === true
  && e?.toString?.()?.includes('.popupWidth') === true
  && e?.toString?.()?.includes('.onlyPopoutIfNeeded') === true) as React.FC<GenericDialogProps>;

export function SteamDialog({ children, ...props }: GenericDialogProps & { readonly children: React.ReactNode; }): React.ReactNode {
  props = {
    modal: false,
    ...props,
  };

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <GenericDialog {...props}>
      <ModalRoot onCancel={props.onDismiss}>
        {children}
      </ModalRoot>
    </GenericDialog>
  );
}
