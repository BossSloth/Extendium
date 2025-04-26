import { Extension } from '../extension/Extension';
import { createOffscreen } from '../windowManagement';
import { createChrome } from './createChrome';

export function injectBrowser(context: string, window: Window, extension: Extension, deps: { createOffscreen: typeof createOffscreen; }): void {
  window.chrome = createChrome(context, extension, deps);

  window.clients = {
    matchAll: async (): Promise<unknown[]> => Promise.resolve([]),
  };

  const originalOnError = window.onerror;

  // eslint-disable-next-line func-names
  window.onerror = function (this: WindowEventHandlers, message, source, lineno, colno, error): boolean {
    console.error(`Error in ${extension.manifest.name} - ${context}`, message, source, lineno, colno, error);

    return originalOnError?.call(this, message, source, lineno, colno, error);
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;

  // eslint-disable-next-line func-names
  window.onunhandledrejection = function (this: WindowEventHandlers, event): unknown {
    console.error(`Error in ${extension.manifest.name} - ${context}`, event);

    return originalOnUnhandledRejection?.call(this, event);
  };

  window.importScripts = (...urls: string[]): void => {
    for (const url of urls) {
      const script = window.document.createElement('script');
      script.src = extension.getFileUrl(url) ?? '';
      window.document.head.appendChild(script);
    }
  };
}

declare global {
  interface Window {
    importScripts(...urls: string[]): void;
    clients: { matchAll(): Promise<unknown[]>; };
  }
}
