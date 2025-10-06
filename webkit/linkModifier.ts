import { ExternalLink } from '@extension/Metadata';
import { WebkitRequestType } from '@extension/websocket/MessageTypes';
import { ExtensionWrapper } from './ExtensionWrapper';
import { webSocketClient } from './shared';

export function linkClickInterceptor(extensions: Map<string, ExtensionWrapper>, externalLinks: ExternalLink[]): void {
  const optionsLinks = getOptionLinks(extensions);

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');

    if (anchor) {
      const href = decodeURIComponent(anchor.href);

      if (optionsLinks.has(href)) {
        event.preventDefault(); // stop default link behavior if needed
        webSocketClient.sendMessage({}, WebkitRequestType.OpenOptions, optionsLinks.get(href) ?? '');

        return;
      }

      if (externalLinks.some(link => linkMatches(link, href))) {
        location.href = `steam://openurl_external/${href}`;
        event.preventDefault();
      }
    }
  });
}

function getOptionLinks(extensions: Map<string, ExtensionWrapper>): Map<string, string> {
  return [...extensions.values()].flatMap((extensionW) => {
    const extension = extensionW.extension;
    const optionsPageUrl = extension.options.getOptionsPageUrl() ?? '';
    const fileUrl = extension.getFileUrl(optionsPageUrl) ?? '';

    return [
      [optionsPageUrl, extension.getName()],
      [fileUrl, extension.getName()],
    ].filter(([key]) => key !== '');
  }).reduce((map, [key, value]) => map.set(key ?? '', value ?? ''), new Map<string, string>());
}

function linkMatches(link: ExternalLink, href: string): boolean {
  if (link.isRegex) {
    return stringToRegex(link.match).test(href);
  }

  return href.includes(link.match);
}

function stringToRegex(input: string): RegExp {
  const match = input.match(/^\/(.*)\/([gimsuy]*)$/);
  if (!match) {
    return new RegExp(input);
  }

  return new RegExp(match[1] ?? '', match[2] ?? '');
}
