import { Extension } from './extension/Extension';
import { loadScriptWithContent, loadStyle } from './shared';

export async function createContentScripts(extension: Extension): Promise<void> {
  const contentScripts = extension.manifest.content_scripts ?? [];
  const currentHref = window.location.href;
  for (const contentScript of contentScripts) {
    if (contentScript.matches?.some(match => currentHref.includes(match) || match === '<all_urls>') ?? false) {
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
