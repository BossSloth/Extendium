import { Extension } from '@extension/Extension';
import { ExtensionInfos } from '@extension/Metadata';
import { UserInfo } from '@extension/shared';
import { Millennium } from '@steambrew/client';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import { BasicPopup } from 'steam-types/Global/managers/PopupManager';

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

export async function getUserInfoPromise(): Promise<UserInfo> {
  return new Promise((resolve) => {
    let userInfoTries = 0;
    const interval = setInterval(() => {
      const userInfoScoped = getUserInfo();
      if (userInfoScoped !== undefined) {
        clearInterval(interval);
        resolve(userInfoScoped);
      }
      if (userInfoTries >= 10) {
        clearInterval(interval);
        console.error('Failed to get user info?');
      }
      userInfoTries++;
    }, 100);
  });
}

function getUserInfo(): UserInfo | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const connectionManager = App.m_cm ?? appDetailsStore.m_CMInterface;
  const steamid = connectionManager.steamid.m_ulSteamID.toString();

  const profileUrl = urlStore.m_steamUrls.SteamIDMyProfile.url;
  const userId = profileUrl.match(/\/id\/(.+)\//)?.[1] ?? '';

  return {
    accountBalance: App.GetCurrentUser().strAccountBalance,
    steamid,
    userId,
    avatarUrl: friendStore.m_FriendsUIFriendStore.GetPlayer(friendStore.currentUserSteamID.GetAccountID()).persona.avatar_url_medium,
    personaName: connectionManager.persona_name,
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
