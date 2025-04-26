import { Millennium } from '@steambrew/client';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import { BasicPopup } from 'steam-types/dist/types/Global/PopupManager';

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
