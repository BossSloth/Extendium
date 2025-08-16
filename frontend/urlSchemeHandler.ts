import { openExtensionManagerPopup } from 'extensions-manager/ExtensionManagerPopup';

/**
 * steam://extendium URL support
 *
 * Example urls
 * "steam://extendium/manager" -> Open the manager
 */
export function handleUrlScheme(_: number, url: string): void {
  const [context, action] = url
    .replace(/^steam:\/{1,2}/, '/')
    .split('/')
    .filter((r: string) => r)
    .slice(1);

  if (context === 'manager') {
    openExtensionManagerPopup(action);
  }
}
