import { ExternalLink } from '@extension/Metadata';
import { UpdateExternalLinks } from 'callables';
import React from 'react';
import { infos } from 'shared';
import DynamicListManager from './DynamicListManager';

export function ExternalLinksManager(): React.ReactNode {
  const [links, setLinks] = React.useState<ExternalLink[]>(infos.externalLinks ?? []);

  function onSave(newLinks: ExternalLink[]): void {
    UpdateExternalLinks({ external_links: JSON.stringify(newLinks) });
    infos.externalLinks = newLinks;
  }

  return (
    <DynamicListManager
      value={links}
      onChange={setLinks}
      onSave={onSave}
      title="External links"
      placeholder="Paste or type a link…"
      addButtonLabel="Add link"
      allowEmpty
    />
  );
}
