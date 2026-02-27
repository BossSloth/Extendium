import { getExtensions, persistentExtensionsPage } from 'chrome/ChromeExtensionPageManager';
import { useExtensionsStore } from 'stores/extensionsStore';

export async function initializeExtension(): Promise<void> {
  const extensionsStore = useExtensionsStore.getState();

  persistentExtensionsPage.on('INSTALLED', (_, extension) => {
    if (extension === undefined) {
      return;
    }
    extensionsStore.addExtension(extension);
  });
  persistentExtensionsPage.on('UNINSTALLED', (extensionId) => {
    extensionsStore.removeExtension(extensionId);
  });
  await persistentExtensionsPage.initialize();

  await getExtensions().then((exts) => {
    exts.forEach((ext) => {
      extensionsStore.addExtension(ext);
    });
  });
}
