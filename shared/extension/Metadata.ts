export interface ExtensionMetadata {
  extensionId: string;
  url: string;
}

export interface ExtensionInfos {
  extensionsDir: string;
  pluginDir: string;
  manifests: Record<string, chrome.runtime.ManifestV3>;
  metadatas?: Record<string, ExtensionMetadata>;
  externalLinks?: ExternalLink[];
}

export interface ExternalLink {
  match: string;
  isRegex: boolean;
}