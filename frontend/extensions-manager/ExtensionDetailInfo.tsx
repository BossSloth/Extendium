import { Extension } from '@extension/Extension';
import { ChromeDevToolsProtocol } from '@steambrew/client';
import { usePopupsStore } from 'components/stores/popupsStore';
import type { Protocol } from 'devtools-protocol';
import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import { MdArrowBack, MdArrowForward, MdOpenInNew } from 'react-icons/md';
import { mainWindow } from 'shared';
import { createOptionsWindow } from 'windowManagement';
import { showRemoveModal } from './RemoveModal';

export function ExtensionDetailInfo({ extension }: { readonly extension: Extension | undefined; }): React.ReactNode {
  const [views, setViews] = React.useState<Protocol.Target.TargetInfo[]>([]);
  const { setManagerPopup } = usePopupsStore();

  if (!extension) {
    return (
      <div className="extension-detail-info">
        <div className="page-header">
          <button onClick={() => { setManagerPopup({ route: null }); }} type="button">
            <MdArrowBack />
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
        <button onClick={() => { setManagerPopup({ route: null }); }} type="button">
          <MdArrowBack />
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
            <span style={{ marginBottom: '1rem' }}>For detailed error information, launch Steam with the <code>-dev</code> parameter and check the console in the specified view</span>
            <ul>
              {extension.errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {extension.hasOptions() && (
        <div className="section hr clickable-row" onClick={() => { createOptionsWindow(extension); }}>
          <span>Extension options</span>
          <button type="button"><MdOpenInNew /></button>
        </div>
      )}

      <div className="section hr clickable-row" onClick={() => { showRemoveModal(extension); }}>
        <span>Remove extension</span>
        <button type="button"><MdArrowForward /></button>
      </div>
    </div>
  );
}
