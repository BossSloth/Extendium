import { Logger } from '@extension/Logger';
import { ExtensionMetadata } from '@extension/Metadata';
import { callable } from '@steambrew/client';
import { useUpdateStore } from './updateStore';

const CHECK_INTERVAL = 60 * 60 * 1000 * 6; // 6 hour

const CheckForUpdates = callable<[], string>('CheckForUpdates');

export function startIntervalForUpdate(): void {
  checkForAllUpdates();
  setInterval(checkForAllUpdates, CHECK_INTERVAL);
}

async function checkForAllUpdates(): Promise<void> {
  Logger.globalLog('Updater', 'Checking for updates...');

  const updateStore = useUpdateStore.getState();

  if (new Date(updateStore.lastChecked).getTime() + CHECK_INTERVAL > Date.now()) {
    Logger.globalLog('Updater', 'Last checked within interval, skipping update check.');

    return;
  }

  const availableUpdates = JSON.parse(await CheckForUpdates()) as Record<string, ExtensionMetadata>;

  Logger.globalLog('Updater', 'Available updates:', availableUpdates);

  useUpdateStore.setState({ updateAvailable: Object.keys(availableUpdates), lastChecked: new Date().toJSON() });
}
