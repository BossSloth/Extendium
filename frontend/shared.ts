import { Millennium } from '@steambrew/client';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import { BasicPopup } from 'steam-types/dist/types/Global/PopupManager';
import { UserInfo } from './extension/shared';

export let mainWindow: Window;

export function initMainWindow(_mainWindow: Window): void {
  mainWindow = _mainWindow;
}

declare global {
  const SP_REACTDOM: typeof ReactDOM & typeof ReactDOMClient;
}

export const EXTENSIONS_URL = 'https://steamloopback.host/extensions';
export const MAIN_WINDOW_NAME = 'SP Desktop_uid0';
export async function WaitForElement(sel: string, parent = document): Promise<Element | undefined> {
  return [...(await Millennium.findElement(parent, sel))][0];
}

export interface ContextMenu {
  Hide(): void;
  Show(): void;
  m_popupContextMenu: BasicPopup;
}

export async function loadScript(src: string, document: Document): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', src);

    script.addEventListener('load', () => {
      resolve();
    });

    script.addEventListener('error', () => {
      reject(new Error('Failed to load script'));
    });

    document.head.appendChild(script);
  });
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
