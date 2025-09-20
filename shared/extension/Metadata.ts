export interface ExtensionMetadata {
  extensionId: string;
  url: string;
}

export interface ExtensionInfos {
  extensionsDir: string;
  externalLinks?: ExternalLink[];
  manifests: Record<string, chrome.runtime.ManifestV3>;
  metadatas?: Record<string, ExtensionMetadata>;
  pluginDir: string;
}

export interface ExternalLink {
  isRegex: boolean;
  match: string;
}
