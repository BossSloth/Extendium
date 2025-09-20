import { Extension } from '@extension/Extension';
import { ExtensionInfos } from '@extension/Metadata';
import { UserInfo } from '@extension/shared';
import { Millennium } from '@steambrew/client';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import { BasicPopup } from 'steam-types/dist/types/Global/PopupManager';

export let mainWindow: Window;

export function initMainWindow(_mainWindow: Window): void {
  mainWindow = _mainWindow;
}

export let pluginDir: string;

export function initPluginDir(_pluginDir: string): void {
  pluginDir = _pluginDir;
}

export let infos: ExtensionInfos;

export function initInfos(_infos: ExtensionInfos): void {
  infos = _infos;
}

declare global {
  const SP_REACTDOM: typeof ReactDOM & typeof ReactDOMClient;
  const extensions: Map<string, Extension>;
}

export const MAIN_WINDOW_NAME = 'SP Desktop_uid0';
export async function WaitForElement(sel: string, parent = document): Promise<Element | undefined> {
  return [...(await Millennium.findElement(parent, sel))][0];
}

export interface ContextMenu {
  Close?(): void;
  Hide(): void;
  Show(): void;
  m_popupContextMenu: BasicPopup;
}

export async function loadScript(src: string, document: Document, attributes?: NamedNodeMap, module?: boolean): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', src);

    if (attributes) {
      for (const attribute of attributes) {
        script.setAttribute(attribute.name, attribute.value);
      }
    }

    if (module === true) {
      script.setAttribute('type', 'module');
    }

    script.addEventListener('load', () => {
      resolve();
    });

    script.addEventListener('error', () => {
      reject(new Error(`Failed to load script "${src}" for document "${document.title}"`));
    });

    document.head.appendChild(script);
  });
}

export function loadScriptSync(src: string, document: Document): void {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', src, false);
  xhr.send();
  const script = document.createElement('script');
  script.textContent = `${xhr.responseText}\n//# sourceURL=${src}`;
  document.head.appendChild(script);
}

export async function getUserInfo(): Promise<UserInfo> {
  const loginUsers = await SteamClient.User.GetLoginUsers();
  const user = loginUsers[0];

  if (!user) {
    throw new Error('Failed to get user info');
  }

  const match = user.avatarUrl.match(/avatarcache\/(\d+)/);
  if (!match) {
    throw new Error('Failed to match avatar URL');
  }

  const steamid = match[1] ?? '';

  const profileUrl = urlStore.m_steamUrls.SteamIDMyProfile.url;
  const userId = profileUrl.match(/\/id\/(.+)\//)?.[1] ?? '';

  return {
    steamid,
    userId,
    avatarUrl: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg', // TODO: replace with loginUsers[0]?.avatarUrl and use correct steam path
    personaName: user.personaName,
  };
}

export function changeTagPreserveChildren(element: Element, newTag: string): HTMLElement {
  const newElement = document.createElement(newTag);

  // Copy attributes
  for (const attr of element.attributes) {
    newElement.setAttribute(attr.name, attr.value);
  }

  // Move children *except* the React mount
  while (element.firstChild) {
    newElement.appendChild(element.firstChild);
  }

  // Swap in DOM
  element.parentNode?.replaceChild(newElement, element);

  return newElement;
}
