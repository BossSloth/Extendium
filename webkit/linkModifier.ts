import { WebkitRequestType } from '@extension/websocket/MessageTypes';
import { ExtensionWrapper } from './ExtensionWrapper';
import { webSocketClient } from './shared';

export function linkClickInterceptor(extensions: Map<string, ExtensionWrapper>): void {
  const optionsLinks = getOptionLinks(extensions);

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');

    if (anchor) {
      if (optionsLinks.has(anchor.href)) {
        event.preventDefault(); // stop default link behavior if needed
        webSocketClient.sendMessage({}, WebkitRequestType.OpenOptions, optionsLinks.get(anchor.href) ?? '');
      }
    }
  });
}

function getOptionLinks(extensions: Map<string, ExtensionWrapper>): Map<string, string> {
  return [...extensions.values()].map((extensionW) => {
    const extension = extensionW.extension;
    const link = extension.getFileUrl(extension.manifest.options_ui?.page) ?? '';

    return [link, extension.getName()];
  }).filter(link => link[0] !== '').reduce((map, [key, value]) => map.set(key ?? '', value ?? ''), new Map<string, string>());
}
