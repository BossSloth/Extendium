import { ExtensionWrapper } from './ExtensionWrapper';

export async function loadStyle(src: string): Promise<void> {
  const content = await fetch(src).then(async response => response.text());
  // content = content.replaceAll('chrome-extension://__MSG_@@extension_id__', LOOPBACK_CDN);

  return new Promise<void>((resolve, reject) => {
    const style = document.createElement('style');
    style.setAttribute('original-src', src);
    style.innerHTML = content;

    style.onload = (): void => {
      resolve();
    };

    style.onerror = (): void => {
      reject(new Error('Failed to load style'));
    };

    document.head.appendChild(style);
  });
}

export async function loadScriptWithContent(src: string, document: Document, content: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = content;
    script.setAttribute('original-src', src);

    script.onload = (): void => {
      resolve();
    };

    script.onerror = (): void => {
      reject(new Error('Failed to load script'));
    };

    document.head.appendChild(script);
    resolve();
  });
}

declare global {
  interface Window {
    extensions: Map<string, ExtensionWrapper>;
  }
}
