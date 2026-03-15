import { Extension } from '@extension/Extension';
import { openExtensionSettingsPopup } from 'components/ExtensionSettingsPopup';

export function createOptionsWindow(extension: Extension): void {
  openExtensionSettingsPopup(
    extension.options.getOptionsPageUrl() ?? '',
    `${extension.name} - Extendium Options`,
  );
}
