import escapeStringRegexp from 'escape-string-regexp';
import { Extension } from './extension/Extension';
import { loadScriptWithContent, loadStyle } from './shared';

type ScriptInfo = NonNullable<chrome.runtime.ManifestV3['content_scripts']>[number];

export async function createContentScripts(extension: Extension): Promise<void> {
  const contentScripts = extension.manifest.content_scripts ?? [];
  const currentHref = window.location.origin + window.location.pathname;
  const scripts: Map<string, ScriptInfo> = new Map<string, ScriptInfo>();
  const styles: Set<string> = new Set<string>();
  for (const contentScript of contentScripts) {
    if (hrefMatches(currentHref, contentScript)) {
      if (contentScript.js) {
        for (const script of contentScript.js) {
          scripts.set(extension.getFileUrl(script) ?? '', contentScript);
        }
      }

      if (contentScript.css) {
        for (const style of contentScript.css) {
          styles.add(extension.getFileUrl(style) ?? '');
        }
      }
    }
  }

  styles.forEach((style) => {
    loadStyle(style);
  });

  await mutateScripts(scripts, extension);
}

async function mutateScripts(urls: Map<string, ScriptInfo>, extension: Extension): Promise<void> {
  const promises = Array.from(urls).map(async ([url, script]) => {
    const content = await (await fetch(url)).text();

    const comment = `// ${url}`;

    if ((script.run_at ?? 'document_end') === 'document_end') {
      return `${comment}\nonHeaderReady(() => {\n${content}\n});`;
    }

    return `${comment}\n${content}`;
  });

  // Also load the extension's locale
  promises.unshift(extension.init().then(() => ''));

  const startMark = performance.mark(`[Extendium][${extension.getName()}] mutateScripts start`);
  const results = await Promise.all(promises);
  const endMark = performance.mark(`[Extendium][${extension.getName()}] mutateScripts end`);
  performance.measure(`[Extendium][${extension.getName()}] mutateScripts`, startMark.name, endMark.name);
  let content = results.join('');

  const combinedUrl = extension.getFileUrl(`${extension.getName().toLowerCase().replace(/\s/g, '_')}_content.js`) ?? '';

  const chromeFunctionString = `const chrome = window.extensions.get('${extension.getName().replace(/'/g, "\\'")}')?.chrome;`;
  // Wrap the script in a function to make it self-contained
  content = `(function() {\n${chromeFunctionString}\n\n${content}\n})();`;
  content += `\n//# sourceURL=${combinedUrl}`;
  content = content.replaceAll('sourceMappingURL=', '');

  loadScriptWithContent(combinedUrl, document, content);
  performance.mark(`[Extendium][${extension.getName()}] mutateScripts done`);
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
