import React, { JSX } from 'react';
import { Extension } from '../extension/Extension';
import { ExtensionButton } from './ExtensionButton';

export function ExtensionsBar({ extensions }: { readonly extensions: Map<string, Extension>; }): JSX.Element {
  return (
    <>
      {[...extensions.values()].map(extension => (
        extension.action.getIconUrl() === undefined
          ? null
          : (
              <ExtensionButton key={extension.manifest.name} extension={extension} />
            )
      ))}
    </>
  );
}
