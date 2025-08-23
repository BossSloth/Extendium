import { base64Decode } from '@extension/utils';

const tabs = new Map<number, ExtendedTab>();
let nextTabId = 0;

export function addTab(tabInfoBase64: string): number {
  const tabInfo = JSON.parse(base64Decode(tabInfoBase64)) as WebkitTabInfo;
  const tabId = nextTabId++;
  tabs.set(tabId, {
    ...tabInfo,
    id: tabId,
    index: tabId,
    pinned: false,
    highlighted: false,
    windowId: 0,
    active: false,
    favIconUrl: '',
    frozen: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: false,
    groupId: 0,
    focused: false,
  });

  return tabId;
}

export function focusTab(tabId: number): void {
  const tab = tabs.get(tabId);
  if (!tab) {
    return;
  }
  tabs.forEach(t => (t.focused = false));
  tab.focused = true;
}

export async function queryTabs(queryInfo: chrome.tabs.QueryInfo, callback?: (tabs: chrome.tabs.Tab[]) => void): Promise<chrome.tabs.Tab[]> {
  let result: chrome.tabs.Tab[] = [];
  if (queryInfo.active === true) {
    result = Array.from(tabs.values()).filter(tab => tab.focused);
  }

  if (callback) {
    callback(result);
  }

  return Promise.resolve(result);
}

export interface WebkitTabInfo {
  title: string;
  url: string;
}

export interface ExtendedTab extends chrome.tabs.Tab {
  focused: boolean;
}
