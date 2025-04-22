import { ContextType } from '../shared';

export class Contexts {
  private readonly contexts: chrome.runtime.ExtensionContext[] = [];

  public addContext(popupWindow: Window, type: ContextType, documentUrl: string | undefined): void {
    this.contexts.push({
      contextId: popupWindow.document.title,
      // @ts-expect-error contextType is not assignable
      contextType: type,
      documentId: '0',
      documentOrigin: '',
      documentUrl,
      frameId: 0,
      incognito: false,
      tabId: -1,
      windowId: -1,
    });
  }

  public async getContexts(filter: chrome.runtime.ContextFilter): Promise<chrome.runtime.ExtensionContext[]> {
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
