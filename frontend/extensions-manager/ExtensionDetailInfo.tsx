import { Extension } from '@extension/Extension';
import { ChromeDevToolsProtocol } from '@steambrew/client';
import type { Protocol } from 'devtools-protocol';
import React from 'react';
import { FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import { mainWindow } from 'shared';

export function ExtensionDetailInfo({ extension, setExtensionDetailRoute }: { readonly extension: Extension | undefined; setExtensionDetailRoute(route: string | null): void; }): React.ReactNode {
  const [views, setViews] = React.useState<Protocol.Target.TargetInfo[]>([]);

  if (!extension) {
    return (
      <div className="extension-detail-info">
        <div className="page-header">
          <button onClick={() => { setExtensionDetailRoute(null); }} type="button">
            <FaArrowLeft />
          </button>
          Error in extension
        </div>
      </div>
    );
  }

  const isDev = mainWindow.document.evaluate('//div[text()="Console"]', mainWindow.document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue !== null;

  React.useEffect(() => {
    if (!isDev) {
      return;
    }

    ChromeDevToolsProtocol.send('Target.getTargets').then((result) => {
      const response = result as Protocol.Target.GetTargetsResponse;
      const ourViews: Protocol.Target.TargetInfo[] = [];
      for (const targetInfo of response.targetInfos) {
        if (targetInfo.title.startsWith(`${extension.getName()} - `)) {
          ourViews.push(targetInfo);
        }
      }
      setViews(ourViews);
    });
  }, []);

  return (
    <div className="extension-detail-info">
      <div className="page-header">
        <button onClick={() => { setExtensionDetailRoute(null); }} type="button">
          <FaArrowLeft />
        </button>
        <img src={extension.action.getDefaultIconUrl(48)} />
        <span>{extension.getName()}</span>
      </div>

      <div className="section">
        <div className="heading">Description</div>
        <div className="content">{extension.getDescription()}</div>
      </div>

      <div className="section hr">
        <div className="heading">Version</div>
        <div className="content">{extension.getVersion()}</div>
      </div>

      {isDev && (
        <div className="section hr">
          <div className="heading">Inspect views</div>
          <div className="content">
            <ul>
              {views.map(view => (
                <li key={view.title}>
                  <a
                    href={`http://localhost:8080/devtools/inspector.html?ws=localhost:8080/devtools/page/${view.targetId}&panel=console`}
                    onClick={(e) => {
                      e.preventDefault();
                      SteamClient.System.OpenInSystemBrowser(`http://localhost:8080/devtools/inspector.html?ws=localhost:8080/devtools/page/${view.targetId}&panel=console`);
                    }}
                  >{view.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {extension.errors.length > 0 && (
        <div className="section hr">
          <div className="heading">
            <FaExclamationCircle color="red" />
            Errors
          </div>
          <div className="content">
            <span>Open steam with -dev and open specified view to see error in console</span>
            <ul>
              {extension.errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
