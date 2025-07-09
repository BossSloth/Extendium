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

// eslint-disable-next-line max-lines-per-function
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

  function initializeViews(): void {
    ChromeDevToolsProtocol.send('Target.getTargets').then((result) => {
      const response = result as Protocol.Target.GetTargetsResponse;
      const ourViews: Protocol.Target.TargetInfo[] = [];
      for (const targetInfo of response.targetInfos) {
        if (targetInfo.title.startsWith(`${extension?.getName()} - `) || targetInfo.title === 'SharedJSContext') {
          ourViews.push(targetInfo);
        }
      }
      setViews(ourViews);
    });
  }

  React.useEffect(() => {
    if (isDev) {
      initializeViews();
    }
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

      {views.length > 0 && (
        <div className="section hr">
          <div className="heading">Inspect views</div>
          <div className="content">
            <ul>
              {views.map(view => (
                <li key={view.title}>
                  <a
                    className="fs-85"
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

      {extension.logger.errors.length > 0 && (
        <div className="section hr" id="errors">
          <div className="heading">
            <FaExclamationCircle color="red" />
            Errors
          </div>
          <div className="content">
            <span style={{ marginBottom: '1rem' }}>For detailed error information, <a href="steam://devmode/enable" onClick={() => { initializeViews(); }}>enable dev mode</a> and open the console of the specified view in the list above</span>
            <ul>
              {extension.logger.errors.map(error => (
                <li key={error}><code>{error}</code></li>
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
