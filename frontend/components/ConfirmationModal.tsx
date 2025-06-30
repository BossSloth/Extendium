/* eslint-disable react/no-multi-comp */
import { ConfirmModal, showModal, ShowModalResult } from '@steambrew/client';
import React, { ReactNode, useEffect } from 'react';
import { mainWindow } from 'shared';

export interface ConfirmationModalProps {
  onCancel?(): void;
  onOK(): Promise<void> | void;
  readonly description: ReactNode;
  readonly hideCloseIcon?: boolean;
  readonly modal: ShowModalResult | null;
  readonly okButtonText: string | ReactNode;
  readonly title: string;
}

function ConfirmationModal({
  description,
  modal,
  title,
  onCancel,
  onOK,
  hideCloseIcon = false,
  okButtonText,
}: ConfirmationModalProps): React.ReactNode {
  return (
    <ConfirmModal
      strTitle={title}
      strDescription={description}
      bHideCloseIcon={hideCloseIcon}
      onOK={async () => {
        await onOK();
      }}
      onCancel={() => {
        if (onCancel) {
          onCancel();
        }
        modal?.Close();
      }}
      strOKButtonText={okButtonText}
    />
  );
}

export interface ShowConfirmationModalOptions {
  onCancel?(): void;
  onOK(): Promise<void> | void;
  readonly bNeverPopOut?: boolean;
  readonly closeOnOK?: boolean;
  readonly description: ReactNode;
  readonly okButtonText: string | ReactNode;
  readonly popupHeight?: number;
  readonly popupWidth?: number;
  readonly title: string;
}

export function showConfirmationModal({
  description,
  title,
  onCancel,
  onOK,
  bNeverPopOut = true,
  okButtonText,
  popupHeight,
  popupWidth,
  closeOnOK = true,
}: ShowConfirmationModalOptions): ShowModalResult {
  let modal: ShowModalResult | null = null;

  function WrappedModal(): React.ReactNode {
    const [modalInstance, setModalInstance] = React.useState<ShowModalResult | null>(null);

    useEffect(() => {
      setModalInstance(modal);
    }, []);

    async function handleOK(): Promise<void> {
      try {
        await onOK();
      } finally {
        if (closeOnOK) {
          modal?.Close();
        }
      }
    }

    function handleCancel(): void {
      if (onCancel) {
        onCancel();
      }
      modal?.Close();
    }

    return (
      <ConfirmationModal
        modal={modalInstance}
        title={title}
        description={description}
        okButtonText={okButtonText}
        onOK={handleOK}
        onCancel={handleCancel}
      />
    );
  }

  modal = showModal(
    <WrappedModal />,
    mainWindow,
    {
      popupHeight,
      popupWidth,
      bNeverPopOut,
      strTitle: title,
    },
  );

  return modal;
}
