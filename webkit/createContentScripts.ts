import { constSysfsExpr } from '@steambrew/webkit';
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

const chromeInjectionContent = constSysfsExpr('chromeInjectionContent.js', { basePath: './' }).content;

async function mutateScripts(urls: Map<string, ScriptInfo>, extension: Extension): Promise<void> {
  if (urls.size === 0) {
    return;
  }

  const documentEndScripts: string[] = [];
  const immediateScripts: string[] = [];

  const promises = Array.from(urls).map(async ([url, script]) => {
    const content = await (await fetch(url)).text();
    const comment = `// ${url}`;

    const scriptContent = `${comment}\n${content}`;
    if ((script.run_at ?? 'document_end') === 'document_end') {
      documentEndScripts.push(scriptContent);
    } else {
      immediateScripts.push(scriptContent);
    }
  });

  // Also load the extension's locale
  promises.unshift(extension.init());

  const startMark = performance.mark(`[Extendium][${extension.getName()}] mutateScripts start`);
  await Promise.all(promises);
  const endMark = performance.mark(`[Extendium][${extension.getName()}] mutateScripts end`);
  performance.measure(`[Extendium][${extension.getName()}] mutateScripts`, startMark.name, endMark.name);

  let content = immediateScripts.join('\n\n');
  if (documentEndScripts.length > 0) {
    content += `\n\nonDomFullyReady(() => {\n${documentEndScripts.join('\n\n')}\n});`;
  }

  const combinedUrl = extension.getFileUrl(`${extension.getName().toLowerCase().replace(/\s/g, '_')}_content.js`) ?? '';

  // chromeFunctionString += `const window = {...globalThis, chrome: extensions.get('${extension.getName().replace(/'/g, "\\'")}')?.chrome}`;
  // Wrap the script in a function to make it self-contained
  content = `(function() {\nconst extensionName = '${extension.getName().replace(/'/g, "\\'")}'\n${chromeInjectionContent}\n${content}\n})();`;
  content += `\n//# sourceURL=${combinedUrl}`;
  content = content.replaceAll('sourceMappingURL=', '');

  loadScriptWithContent(combinedUrl, document, content);
  performance.mark(`[Extendium][${extension.getName()}] mutateScripts done`);
}

function urlToRegex(url: string): string {
  return `^${escapeStringRegexp(url)
    .replace(/\\\*/g, '.*')
    .replace(/\//g, '\\/')
    // Handles cases like `*://*.steamcommunity` where the //*. only matches subdomains
    .replace(':\\/\\/.*\\.', ':\\/\\/.*\\.?')
  }$`;
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
