import React from 'react';
import { showConfirmationModal } from '../components/ConfirmationModal';

export function showRestartModal(): void {
  showConfirmationModal({
    title: 'Restart Required',
    description: (
      <>
        <p>Steam needs to be restarted for the changes to take effect.</p>
        <p>Weird things might happen if you don&apos;t restart Steam.</p>
        <p>Would you like to restart Steam now?</p>
      </>
    ),
    okButtonText: 'Restart Now',
    onOK: () => {
      SteamClient.Browser.RestartJSContext();
    },
    bNeverPopOut: true,
    closeOnOK: false,
  });
}
