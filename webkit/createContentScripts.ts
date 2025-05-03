import escapeStringRegexp from 'escape-string-regexp';
import { Extension } from './extension/Extension';
import { loadScriptWithContent, loadStyle } from './shared';

export async function createContentScripts(extension: Extension): Promise<void> {
  const contentScripts = extension.manifest.content_scripts ?? [];
  const currentHref = window.location.href;
  for (const contentScript of contentScripts) {
    if (hrefMatches(currentHref, contentScript)) {
      if (contentScript.js) {
        for (const script of contentScript.js) {
          // eslint-disable-next-line no-await-in-loop
          await mutateScript(extension.getFileUrl(script) ?? '', extension);
        }
      }

      if (contentScript.css) {
        for (const style of contentScript.css) {
          // eslint-disable-next-line no-await-in-loop
          await loadStyle(extension.getFileUrl(style) ?? '');
        }
      }
    }
  }
}

async function mutateScript(url: string, extension: Extension): Promise<void> {
  let content = await fetch(url).then(async r => r.text());
  const chromeFunctionString = `const chrome = window.extensions.get('${extension.getName()}')?.chrome;`;
  // Wrap the script in a function to make it self-contained
  content = `(function() {\n${chromeFunctionString}\n\n${content}\n})();`;
  content += `\n//# sourceURL=${url}`;

  await loadScriptWithContent(url, document, content);
}

function urlToRegex(url: string): string {
  return `^${escapeStringRegexp(url).replace(/\\\*/g, '.*').replace(/\//g, '\\/')}$`;
}

function hrefMatches(href: string, contentScript: {
  matches?: string[] | undefined;
  exclude_matches?: string[] | undefined;
}): boolean {
  if (contentScript.matches?.some(match => match === '<all_urls>') ?? false) {
    return true;
  }

  return (contentScript.matches?.some(match => href.match(urlToRegex(match)) !== null) ?? false) && (contentScript.exclude_matches?.every(match => href.match(urlToRegex(match)) === null) ?? true);
}
