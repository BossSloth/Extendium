/* eslint-disable func-names */
import { Extension } from '@extension/Extension';
import { ConfirmModal, showModal } from '@steambrew/client';
import React from 'react';
import { loadScriptSync } from 'shared';
import { patchFetch } from './corsFetch';
import { createChrome } from './createChrome';

export function injectBrowser(context: string, window: Window, extension: Extension, senderUrl?: string): void {
  window.chrome = createChrome(context, extension, senderUrl);

  window.clients = {
    matchAll: async (): Promise<unknown[]> => Promise.resolve([]),
  };

  const originalOnError = window.onerror;

  window.onerror = function (this: WindowEventHandlers, ...args: unknown[]): boolean {
    extension.logger.error(context, ...args);

    // @ts-expect-error ignore
    return originalOnError?.call(this, ...args);
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;

  window.onunhandledrejection = function (this: WindowEventHandlers, event): unknown {
    extension.logger.error(context, event);

    return originalOnUnhandledRejection?.call(this, event);
  };

  const originalConsoleError = window.console.error;

  window.console.error = function (...args: unknown[]): void {
    extension.logger.error(context, ...args);

    originalConsoleError(...args);
  };

  window.importScripts = (...urls: string[]): void => {
    for (const url of urls) {
      loadScriptSync(extension.getFileUrl(url) ?? '', window.document);
    }
  };

  patchFetch(window, extension);

  window.confirm = (message?: string): boolean => {
    const description = (
      <>
        <p>Oops looks like the extension {extension.getName()} tried to open a confirmation dialog. Sadly, this is not supported.</p>
        <p>Original confirmation message was: <strong>{message}</strong></p>
      </>
    );
    showModal(<ConfirmModal strDescription={description} strTitle="Unsupported Dialog" />, window);

    return false;
  };

  window.windowProxy = window;
}

declare global {
  interface Window {
    importScripts(...urls: string[]): void;
    clients: { matchAll(): Promise<unknown[]>; };
    console: typeof console;
    windowProxy: Window;
  }
}
