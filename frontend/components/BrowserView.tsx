import { ChromeDevToolsProtocol, findClass } from '@steambrew/client';
import { RuntimeEvaluate } from 'chrome/ChromePageManager';
import React, { useEffect, useRef, useState } from 'react';
import { uniqueId } from 'shared';
import { BrowserViewPopup } from 'steam-types/types/SteamClient/BrowserView/BrowserViewPopup';
import { useExtensionsStore } from 'stores/extensionsStore';
import { handleUrlScheme } from 'urlSchemeHandler';
import { BrowserViewHost } from './SteamComponents';

interface BrowserViewProps {
  onCreated?(sessionId: string): void;
  onFocusChanged?(focused: boolean): void;
  readonly expectedParentPopupTitle: string;
  readonly url: string;
}

export function BrowserView({ url, expectedParentPopupTitle, onFocusChanged, onCreated }: BrowserViewProps): React.ReactNode {
  const [browserView, setBrowserView] = useState<BrowserViewPopup | null>(null);
  const cdpSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function initializeBrowser(): Promise<void> {
      await waitUntil(() => {
        return Array.from(g_PopupManager.m_mapPopups.values()).some(popup => popup.m_strTitle === expectedParentPopupTitle);
      });
      const popup = Array.from(g_PopupManager.m_mapPopups.values()).find(value => value.m_strTitle === expectedParentPopupTitle);
      if (!popup) {
        throw new Error('Popup not found');
      }

      const popupId = popup.window.SteamClient.Browser.GetBrowserID();

      const browserPopup = SteamClient.BrowserView.CreatePopup({
        parentPopupBrowserID: popupId,
        bOnlyAllowTrustedPopups: true,
      });
      const newBrowserWindow = window.open(browserPopup.strCreateURL);
      if (!newBrowserWindow) {
        throw new Error('Failed to open popup');
      }
      const newBrowserView = browserPopup.browserView;

      setBrowserView(newBrowserView);

      newBrowserView.on('focus-changed', (focus) => {
        onFocusChanged?.(focus);
      });

      const randomId = uniqueId();
      newBrowserWindow.document.title = randomId;

      const targets = await ChromeDevToolsProtocol.send('Target.getTargets');
      const target = targets.targetInfos.find(tr => tr.title === randomId);
      if (!target) {
        throw new Error('Target not found');
      }

      const sessionId = (await ChromeDevToolsProtocol.send('Target.attachToTarget', {
        targetId: target.targetId,
        flatten: true,
      })).sessionId;

      cdpSessionIdRef.current = sessionId;

      await ChromeDevToolsProtocol.send('Runtime.enable', undefined, sessionId);

      await ChromeDevToolsProtocol.send('Runtime.addBinding', {
        name: 'extendiumNavigate',
      }, sessionId);

      await ChromeDevToolsProtocol.send('Page.navigate', {
        url,
      }, sessionId);

      RuntimeEvaluate(sessionId, handleBrowserViewCreated, [Array.from(getOptionLinks())]);

      onCreated?.(sessionId);
    }

    initializeBrowser();

    return (): void => {
      if (cdpSessionIdRef.current !== null) {
        ChromeDevToolsProtocol.send('Page.close', undefined, cdpSessionIdRef.current);
      }
    };
  }, [url]);

  if (!browserView) {
    return null;
  }

  return (
    <>
      <style>{browserViewStyle}</style>
      <BrowserViewHost
        browser={browserView}
        className={findClass('Browser') as string}
        visible
      />
    </>
  );
}

interface BindingCalledMessage {
  method: string;
  params?: {
    name: string;
    payload?: string;
  };
}

const originalHandleMessage = ChromeDevToolsProtocol.handleMessage.bind(ChromeDevToolsProtocol);
ChromeDevToolsProtocol.handleMessage = (message: unknown): void => {
  const data: BindingCalledMessage = typeof message === 'string' ? JSON.parse(message) as BindingCalledMessage : message as BindingCalledMessage;

  if (data.method === 'Runtime.bindingCalled' && data.params?.name === 'extendiumNavigate') {
    const { url: targetUrl } = JSON.parse(data.params.payload ?? '{}') as { url: string; };
    handleUrlScheme(0, targetUrl);
  }

  originalHandleMessage(message);
};

async function waitUntil(condition: () => boolean, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 10);
  });
}

const browserViewStyle = /* css */`
.DialogContent {
  padding: 0 !important;
  padding-top: 2rem !important;
}
.${findClass('Browser') as string} {
  height: 100% !important;
}
`;

interface BindingGlobal {
  extendiumNavigate?(payload: string): void;
}

async function handleBrowserViewCreated(optionsLinks: [string, string][]): Promise<void> {
  await new Promise<void>((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        resolve();
      }, { once: true });
    }
  });

  const optionsLinksMap = new Map(optionsLinks);

  document.addEventListener('click', (event) => {
    console.log(event);
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');

    if (anchor !== null) {
      const extensionId = optionsLinksMap.get(decodeURIComponent(anchor.href));
      if (extensionId !== undefined) {
        event.preventDefault();

        (globalThis as BindingGlobal).extendiumNavigate?.(JSON.stringify({ url: `steam://extendium/extension/${extensionId}/options` }));
      }
    }
  });
}

export function getOptionLinks(): Map<string, string> {
  return Array.from(useExtensionsStore.getState().extensions.values()).map((extension): [string, string] => {
    return [extension.extensionInfo.optionsPage?.url ?? '', extension.id];
  }).filter(link => link[0] !== '')
    .reduce((map, [key, value]) => map.set(key, value), new Map<string, string>());
}
