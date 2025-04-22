import { Extension } from '../extension/Extension';
import { createOffscreen } from '../windowManagement';
import { createChrome } from './createChrome';

export function injectBrowser(context: string, window: Window, extension: Extension, deps: { createOffscreen: typeof createOffscreen; }): void {
  window.chrome = createChrome(context, extension, deps);
  // @ts-expect-error Property 'clients' does not exist on type 'Window'.
  window.clients = {
    matchAll: async (): Promise<unknown[]> => Promise.resolve([]),
  };

  window.onerror = (message, source, lineno, colno, error): boolean => {
    console.error(`Error in ${extension.manifest.name} - ${context}`, message, source, lineno, colno, error);

    return true;
  };

  window.onunhandledrejection = (event): boolean => {
    console.error(`Error in ${extension.manifest.name} - ${context}`, event);

    return true;
  };
}
