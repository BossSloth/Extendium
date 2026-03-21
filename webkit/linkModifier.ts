import { ExtendiumSettings, ExternalLink } from '@extension/Metadata';

export function linkClickInterceptor(externalLinks: ExternalLink[], settings: ExtendiumSettings): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');

    if (anchor) {
      const href = decodeURIComponent(anchor.href);

      if (settings.openLinksInCurrentTab === true) {
        if (anchor.target === '_blank') {
          anchor.target = '_self';
        }

        const externalPrefixes = [
          'steam://openurl_external/',
          'steam://openurl/',
        ];

        for (const prefix of externalPrefixes) {
          if (href.startsWith(prefix)) {
            const url = href.replace(prefix, '');
            anchor.href = url;
            break;
          }
        }
      }

      if (externalLinks.some(link => linkMatches(link, href)) || (!href.startsWith('http') && !href.startsWith('steam://'))) {
        location.href = `steam://openurl_external/${href}`;
        event.preventDefault();
      }
    }
  }, true);
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
