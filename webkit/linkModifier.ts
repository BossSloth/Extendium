import { ExternalLink } from '@extension/Metadata';

export function linkClickInterceptor(externalLinks: ExternalLink[]): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');

    if (anchor) {
      const href = decodeURIComponent(anchor.href);

      if (externalLinks.some(link => linkMatches(link, href))) {
        location.href = `steam://openurl_external/${href}`;
        event.preventDefault();
      }
    }
  });
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
