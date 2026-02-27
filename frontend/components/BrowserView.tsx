import { ChromeDevToolsProtocol, findClass } from '@steambrew/client';
import React, { useEffect, useRef, useState } from 'react';
import { BrowserViewPopup } from 'steam-types/types/SteamClient/BrowserView/BrowserViewPopup';
import { BrowserViewHost } from './SteamComponents';
import { uniqueId } from 'shared';

interface BrowserViewProps {
  readonly expectedParentPopupTitle: string;
  readonly url: string;
}

export function BrowserView({ url, expectedParentPopupTitle }: BrowserViewProps): React.ReactNode {
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

      // await ChromeDevToolsProtocol.send('Page.navigate', {
      //   url,
      // }, sessionId);

      await ChromeDevToolsProtocol.send('Page.navigate', {
        url: 'chrome-extension://kdbmhfkmnlmbkgbabkdealhhbfhlmmon/options/popup.html',
      }, sessionId);
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
