// import { callable } from '@steambrew/webkit';

// const AddTab = callable<[{ tabInfo: string; }], number>('Webkit.AddTab');
// const FocusTab = callable<[{ tabId: number; }], void>('Webkit.FocusTab');

// let tabId: number | undefined;

export async function TabInject(): Promise<void> {
  // tabId = await AddTab({ tabInfo: base64Encode(JSON.stringify({
  //   url: location.href,
  //   title: document.title,
  // })) });
  // await FocusTab({ tabId });

  // window.addEventListener('focus', () => {
  //   FocusTab({ tabId: tabId ?? 0 });
  // });
}

export interface WebkitTabInfo {
  title: string;
  url: string;
}
