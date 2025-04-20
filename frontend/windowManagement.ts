import { injectBrowser } from './Browser';
import { Extension } from './extension/Extension';
import { loadScript, mainWindow } from './shared';

export async function createWindow(extension: Extension, title: string): Promise<Window> {
  const popup = SteamClient.BrowserView.CreatePopup({ parentPopupBrowserID: mainWindow.SteamClient.Browser.GetBrowserID() });
  const backgroundWindow = window.open(popup.strCreateURL);
  if (!backgroundWindow) {
    throw new Error('Failed to create window');
  }
  backgroundWindow.SteamClient.Window.HideWindow();

  backgroundWindow.document.title = title;

  // const backgroundWindow = backgroundPopup.m_popupContextMenu.m_popup;
  await injectBrowser(title, backgroundWindow, extension);

  return backgroundWindow;
}

export async function createWindowWithScript(scriptPath: string, extension: Extension, title: string): Promise<Window> {
  const script = extension.getFileUrl(scriptPath);
  if (script === undefined) {
    throw new Error(`Script ${scriptPath} not found`);
  }

  const backgroundWindow = await createWindow(extension, title);

  await loadScript(script, backgroundWindow.document);

  return backgroundWindow;
}
