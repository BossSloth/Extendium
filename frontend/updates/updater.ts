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
  console.log('[Extendium] Checking for updates...');

  const updateStore = useUpdateStore.getState();

  if (new Date(updateStore.lastChecked).getTime() + CHECK_INTERVAL > Date.now()) {
    console.log('[Extendium] Last checked within interval, skipping update check.');

    return;
  }

  const availableUpdates = JSON.parse(await CheckForUpdates()) as Record<string, ExtensionMetadata>;

  console.log('[Extendium] Available updates:', availableUpdates);

  useUpdateStore.setState({ updateAvailable: Object.keys(availableUpdates), lastChecked: new Date().toJSON() });
}
