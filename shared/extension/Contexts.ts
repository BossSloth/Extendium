export class Contexts {
  private readonly contexts: ExtendedExtensionContext[] = [];

  public addContext(popupWindow: Window, type: ContextType, documentUrl: string | undefined): void {
    this.contexts.push({
      contextId: popupWindow.document.title,
      contextType: type,
      documentId: '0',
      documentOrigin: '',
      documentUrl,
      frameId: 0,
      incognito: false,
      tabId: -1,
      windowId: -1,
      popupWindow,
    });
  }

  public async getContexts(filter: chrome.runtime.ContextFilter): Promise<ExtendedExtensionContext[]> {
    return Promise.resolve(this.contexts.filter((context) => {
      if (filter.contextTypes && !filter.contextTypes.includes(context.contextType)) {
        return false;
      }

      if (filter.documentUrls && context.documentUrl !== undefined && !filter.documentUrls.includes(context.documentUrl)) {
        return false;
      }

      if (filter.incognito !== undefined
        || filter.contextIds !== undefined
        || filter.tabIds !== undefined
        || filter.windowIds !== undefined
        || filter.documentIds !== undefined
        || filter.frameIds !== undefined
        || filter.documentOrigins !== undefined
      ) {
        throw new Error('Not implemented');
      }

      return true;
    }));
  }
}

export interface ExtendedExtensionContext extends chrome.runtime.ExtensionContext {
  popupWindow: Window;
}

export type ContextType = `${chrome.runtime.ContextType}`;
