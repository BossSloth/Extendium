import { ExtensionWrapper } from './ExtensionWrapper';
import { WebSocketClient } from './websocket/WebSocketClient';

export let webSocketClient: WebSocketClient;

export function initWebSocketClient(): void {
  webSocketClient = new WebSocketClient();
}

export function loadStyle(src: string): void {
  const style = document.createElement('link');
  style.setAttribute('rel', 'stylesheet');
  style.setAttribute('href', src);

  document.head.appendChild(style);
}

export function loadScriptWithContent(src: string, document: Document, content: string): void {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.textContent = content;
  script.setAttribute('original-src', src);

  document.head.appendChild(script);
}

declare global {
  interface Window {
    extensions: Map<string, ExtensionWrapper>;
  }
}

export function isSteamPage(): boolean {
  return window.location.href.includes('https://store.steampowered.com') || window.location.href.includes('https://steamcommunity.com');
}

export function onDomReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}
// @ts-expect-error onDomReady is not defined on window
window.onDomFullyReady = onDomFullyReady;

export function onDomFullyReady(callback: () => void): void {
  if (isSteamPage()) {
    if (document.getElementById('global_header') !== null) {
      callback();
    } else {
      document.addEventListener('headerReady', callback);
    }
  } else {
    onDomReady(callback);
  }
}
