import { callable } from '@steambrew/webkit';
import { loadStyle } from '../shared';
import { legacyFakeHeader, reactFakeHeader } from './fake-header-strings';

const getSteamId = callable<[], string>('GetSteamId');

function getIdFromAppConfig(): string | null {
  const appConfig = document.querySelector('#application_config');

  if (!appConfig) {
    console.warn('appConfig not found');

    return null;
  }

  const userInfo = appConfig.getAttribute('data-userinfo');

  if (userInfo === null) {
    console.warn('data-userinfo not found on application_config');

    return null;
  }

  const info = JSON.parse(userInfo) as { steamid: string; };

  return info.steamid;
}

function getIdFromScript(context: Node): string | null {
  const script = document.evaluate('//script[contains(text(), \'g_steamID\')]', context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (!script) {
    console.warn('script steamid not found');

    return null;
  }

  return script.textContent?.match(/g_steamID.+?(\d+)/)?.[1] ?? null;
}

export async function createFakeSteamHeader(): Promise<void> {
  const steamid = getIdFromAppConfig() ?? getIdFromScript(document) ?? await getSteamId();
  // if (steamid === null) {
  //   steamid = '-1';
  //   console.warn('Could not get steamid, fake header will not be complete.');
  // }

  const isReactPage = document.querySelector('[data-react-nav-root]') !== null;

  let pageContent: HTMLElement | null;
  if (isReactPage) {
    // Wait on react to load
    const start = performance.now();
    while (performance.now() - start < 5000) {
      // @ts-expect-error any, global react object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-underscore-dangle, @typescript-eslint/no-unsafe-member-access
      const root = SSR?.reactRoot?._internalRoot;
      if (root !== undefined) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(100);
    }

    if (performance.now() - start > 5000) {
      throw new Error('Timed out waiting for react root');
    }

    const html = reactFakeHeader.replaceAll('%user_id%', steamid).replaceAll('%img_src%', 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg');
    pageContent = document.querySelector('#StoreTemplate');

    if (pageContent === null) {
      throw new Error('Could not find page content');
    }

    pageContent.insertAdjacentHTML('afterbegin', html);
  } else {
    const html = legacyFakeHeader.replaceAll('%user_id%', steamid).replaceAll('%img_src%', 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg');
    pageContent = document.querySelector('.responsive_page_content') ?? document.querySelector('.headerOverride');
    pageContent?.insertAdjacentHTML('afterbegin', html);
  }

  const header = document.getElementById('global_header');

  if (header === null) {
    throw new Error('Could not find global header');
  }

  header.style.display = 'block';

  const headerContent = header.firstElementChild as HTMLElement;
  headerContent.style.transition = 'height 0.25s ease-in-out 0s';
  headerContent.style.overflow = 'hidden';
  headerContent.style.setProperty('height', '0px', 'important');

  loadStyle('https://store.fastly.steamstatic.com/public/css/applications/store/greenenvelope.css');

  const showButton = document.createElement('button');
  showButton.style.position = 'fixed';
  showButton.style.top = '0';
  showButton.style.right = '0';
  showButton.style.display = 'none';
  showButton.style.zIndex = '9000';

  showButton.textContent = 'Show Header';

  let headerShown = false;

  showButton.addEventListener('click', () => {
    if (headerShown) {
      headerContent.style.overflow = 'hidden';
      headerContent.style.setProperty('height', '0px', 'important');
      showButton.textContent = 'Show Header';
    } else {
      headerContent.style.removeProperty('height');
      showButton.textContent = 'Hide Header';
      setTimeout(() => {
        headerContent.style.removeProperty('overflow');
      }, 250);
    }
    headerShown = !headerShown;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
      showButton.style.display = 'block';
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
      showButton.style.display = 'none';
    }
  });

  pageContent?.prepend(showButton);

  if (!isReactPage) {
    loadTooltips();
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

function loadTooltips(): void {
  // @ts-expect-error $J is not defined
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  (window.$J ?? window.$)('#global_header .supernav').v_tooltip({
    location: 'bottom',
    destroyWhenDone: false,
    tooltipClass: 'supernav_content',
    offsetY: -6,
    offsetX: 1,
    horizontalSnap: 4,
    tooltipParent: '#global_header .supernav_container',
    correctForScreenSize: false,
  });
}
