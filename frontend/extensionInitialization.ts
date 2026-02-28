import { Extension } from '@extension/Extension';
import { getExtensionManifest, getExtensions, persistentExtensionsPage } from 'chrome/ChromeExtensionPageManager';
import { ExtensionInfo } from 'chrome/types';
import { useExtensionsStore } from 'stores/extensionsStore';

export async function initializeExtension(): Promise<void> {
  const { setExtension, removeExtension } = useExtensionsStore.getState();

  persistentExtensionsPage.on('INSTALLED', async (_, extensionInfo) => {
    if (extensionInfo === undefined) {
      return;
    }
    setExtension(new Extension(await getExtensionManifest(extensionInfo.id), extensionInfo));
  });
  persistentExtensionsPage.on('UNINSTALLED', (extensionId) => {
    removeExtension(extensionId);
  });

  function updateExistingExtension(extensionId: string, extensionInfo: ExtensionInfo | undefined): void {
    const existingExtension = useExtensionsStore.getState().extensions.get(extensionId);
    if (existingExtension === undefined || extensionInfo === undefined) {
      return;
    }
    setExtension(new Extension(existingExtension.manifest, extensionInfo));
  }
  persistentExtensionsPage.on('LOADED', updateExistingExtension);
  persistentExtensionsPage.on('UNLOADED', updateExistingExtension);
  await persistentExtensionsPage.initialize();

  await getExtensions().then((exts) => {
    exts.forEach(async (ext) => {
      setExtension(new Extension(await getExtensionManifest(ext.id), ext));
    });
  });
}
