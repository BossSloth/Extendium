export interface ExtensionMetadata {
  extensionId: string;
  url: string;
}

export interface ExtendiumInfo {
  externalLinks?: ExternalLink[];
}

export interface ExternalLink {
  isRegex: boolean;
  match: string;
}
