import { openExtensionManagerPopup } from 'extensions-manager/ExtensionManagerPopup';
import { useExtensionsStore } from 'stores/extensionsStore';
import { createOptionsWindow } from 'windowManagement';

/**
 * steam://extendium URL support
 *
 * Example urls
 * "steam://extendium/manager" -> Open the manager
 * "steam://extendium/extension/<extensionId>/options" -> Open the extension options
 */
export function handleUrlScheme(_: number, url: string): void {
  const parts = url
    .replace(/^steam:\/{1,2}/, '/')
    .split('/')
    .filter((r: string) => r)
    .slice(1);

  const context = parts[0];
  const action = parts.slice(1).join('/');

  if (context === 'manager') {
    openExtensionManagerPopup(action);
  }

  if (context === 'extension' && action !== '') {
    handleExtensionUrlScheme(action);
  }
}

function handleExtensionUrlScheme(url: string): void {
  const [extensionId, action] = url.split('/');

  if (extensionId === undefined || action === undefined) {
    return;
  }

  const extension = useExtensionsStore.getState().extensions.get(extensionId);

  if (!extension) {
    return;
  }

  switch (action) {
    case 'options':
      if (extension.options.hasOptions()) {
        createOptionsWindow(extension);
      }
      break;
    default:
      console.warn(`Unknown extension action: ${action}`, extensionId);
      break;
  }
}
