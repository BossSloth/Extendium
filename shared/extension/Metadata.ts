export interface ExtensionMetadata {
  extensionId: string;
  url: string;
}

export interface ExtendiumSettings {
  openLinksInCurrentTab?: boolean;
}

export interface ExtendiumInfo {
  externalLinks?: ExternalLink[];
  settings?: ExtendiumSettings;
}

export interface ExternalLink {
  isRegex: boolean;
  match: string;
}
