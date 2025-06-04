/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { findModule } from '@steambrew/client';
import React from 'react';
import { ExtensionsBar } from './components/ExtensionBar/ExtensionsBar';
import { Extension } from './extension/Extension';
import { WaitForElement } from './shared';

export async function patchUrlBar(extensions: Map<string, Extension>, document: Document): Promise<void> {
  const classes = {
    steamdesktop: findModule(e => e.FocusBar) as Record<string, string>,
    steamPopupTab: findModule(e => e.BrowserTabIcon) as Record<string, string>,
  };
  const urlBar = await WaitForElement(
    `.${classes.steamdesktop.URLBar}, .${classes.steamPopupTab.URLBar}`,
    document,
  );

  if (!urlBar) {
    return;
  }

  if (document.querySelector('.extensions-bar-container') !== null) {
    return;
  }

  const extensionsBar = document.createElement('div');
  extensionsBar.classList.add('extensions-bar-container');
  urlBar.appendChild(extensionsBar);

  const reactRoot = SP_REACTDOM.createRoot(extensionsBar);

  reactRoot.render(<ExtensionsBar extensions={extensions} />);
}
