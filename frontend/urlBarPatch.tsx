import { findModule } from '@steambrew/client';
import React from 'react';
import { ExtensionsBar } from './components/ExtensionsBar';
import { Extension } from './extension/Extension';
import { WaitForElement } from './shared';

export async function patchUrlBar(extensions: Map<string, Extension>, document: Document): Promise<void> {
  const classes = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    steamdesktop: findModule(e => e.FocusBar) as Record<string, string>,
  };
  const urlBar = await WaitForElement(
    `.${classes.steamdesktop.URLBar}`,
    document,
  );

  if (!urlBar) {
    return;
  }

  const extensionsBar = document.createElement('div');
  extensionsBar.classList.add('extensions-bar-container');
  urlBar.appendChild(extensionsBar);

  const reactRoot = SP_REACTDOM.createRoot(extensionsBar);

  reactRoot.render(<ExtensionsBar extensions={extensions} />);
}
