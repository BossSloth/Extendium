import { Extension } from '@extension/Extension';
import { constSysfsExpr } from '@steambrew/webkit';
import { loadScriptWithContent, loadStyle } from './shared';

type ScriptInfo = NonNullable<chrome.runtime.ManifestV3['content_scripts']>[number];

export async function createContentScripts(extension: Extension): Promise<void> {
  const contentScripts = extension.manifest.content_scripts ?? [];
  const scripts: Map<string, ScriptInfo> = new Map<string, ScriptInfo>();
  const styles: Set<string> = new Set<string>();
  for (const contentScript of contentScripts) {
    if (hrefMatches(location.href, contentScript)) {
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

function matchPatternToRegex(pattern: string): RegExp {
  if (pattern === '<all_urls>') {
    return /^(https?|ftp|file|chrome-extension):\/\/.*/;
  }

  const [, scheme, host, path] = pattern.match(/^(\*|http|https|file|ftp|chrome-extension):\/\/([^/]*)(\/.*)$/) ?? [];

  if (scheme === undefined || host === undefined || path === undefined) {
    throw new Error(`Invalid match pattern: ${pattern}`);
  }

  let regex = '^';

  // Scheme
  if (scheme === '*') {
    regex += '(http|https)';
  } else {
    regex += scheme;
  }
  regex += ':\\/\\/';

  // Host
  if (host === '*') {
    regex += '[^/]+';
  } else if (host.startsWith('*.')) {
    regex += `([^.]+\\.)?${host.slice(2).replace(/\./g, '\\.')}`;
  } else {
    regex += host.replace(/\./g, '\\.');
  }

  // Path
  regex += path.replace(/\*/g, '.*');
  regex += '$';

  return new RegExp(regex);
}

function hrefMatches(href: string, contentScript: {
  matches?: string[] | undefined;
  exclude_matches?: string[] | undefined;
}): boolean {
  return (contentScript.matches?.some(match => matchPatternToRegex(match).test(href)) ?? false) && (contentScript.exclude_matches?.every(match => !matchPatternToRegex(match).test(href)) ?? true);
}
