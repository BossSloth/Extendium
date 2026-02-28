import { Extension } from '@extension/Extension';
import { getExtensionManifest, getExtensions, persistentExtensionsPage } from 'chrome/ChromeExtensionPageManager';
import { useExtensionsStore } from 'stores/extensionsStore';

export async function initializeExtension(): Promise<void> {
  const extensionsStore = useExtensionsStore.getState();

  persistentExtensionsPage.on('INSTALLED', async (_, extensionInfo) => {
    if (extensionInfo === undefined) {
      return;
    }
    extensionsStore.addExtension(new Extension(await getExtensionManifest(extensionInfo.id), extensionInfo));
  });
  persistentExtensionsPage.on('UNINSTALLED', (extensionId) => {
    extensionsStore.removeExtension(extensionId);
  });
  await persistentExtensionsPage.initialize();

  await getExtensions().then((exts) => {
    exts.forEach(async (ext) => {
      extensionsStore.addExtension(new Extension(await getExtensionManifest(ext.id), ext));
    });
  });
}
