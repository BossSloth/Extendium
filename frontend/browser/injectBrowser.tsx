/* eslint-disable func-names */
import { ConfirmModal, showModal } from '@steambrew/client';
import React from 'react';
import { Extension } from '../extension/Extension';
import { patchFetch } from './corsFetch';
import { createChrome } from './createChrome';

export function injectBrowser(context: string, window: Window, extension: Extension): void {
  window.chrome = createChrome(context, extension);

  window.clients = {
    matchAll: async (): Promise<unknown[]> => Promise.resolve([]),
  };

  const originalOnError = window.onerror;

  window.onerror = function (this: WindowEventHandlers, ...args: unknown[]): boolean {
    console.error(`Error in ${extension.manifest.name} - ${context}`, ...args);

    extension.errors.push(`Error in "${extension.manifest.name} - ${context}": ${args.join(' ')}`);

    // @ts-expect-error ignore
    return originalOnError?.call(this, ...args);
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;

  window.onunhandledrejection = function (this: WindowEventHandlers, event): unknown {
    console.error(`Error in ${extension.manifest.name} - ${context}`, event);

    extension.errors.push(`Error in "${extension.manifest.name} - ${context}": ${event.reason}`);

    return originalOnUnhandledRejection?.call(this, event);
  };

  const originalConsoleError = window.console.error;

  window.console.error = function (...args: unknown[]): void {
    originalConsoleError(...args);

    console.error(`Error in ${extension.manifest.name} - ${context}`, ...args);

    extension.errors.push(`Error in "${extension.manifest.name} - ${context}": ${args.join(' ')}`);
  };

  window.importScripts = (...urls: string[]): void => {
    for (const url of urls) {
      const script = window.document.createElement('script');
      script.src = extension.getFileUrl(url) ?? '';
      window.document.head.appendChild(script);
    }
  };

  patchFetch(window);

  window.confirm = (message?: string): boolean => {
    const description = (
      <>
        <p>Oops looks like the extension {extension.manifest.name} tried to open a confirmation dialog. Sadly, this is not supported.</p>
        <p>Original confirmation message was: <strong>{message}</strong></p>
      </>
    );
    showModal(<ConfirmModal strDescription={description} strTitle="Unsupported Dialog" />, window);

    return false;
  };
}

declare global {
  interface Window {
    importScripts(...urls: string[]): void;
    clients: { matchAll(): Promise<unknown[]>; };
    console: typeof console;
  }
}
