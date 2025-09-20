import { ExternalLink } from "@extension/Metadata";
import { UpdateExternalLinks } from "callables";
import { infos } from "index";
import React from "react";
import DynamicListManager from "./DynamicListManager";

export const ExternalLinksManager = () => {
    const [links, setLinks] = React.useState<ExternalLink[]>(infos.externalLinks ?? []);

    function onSave(newLinks: ExternalLink[]) {
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
            allowEmpty={true}
        />
    );
};