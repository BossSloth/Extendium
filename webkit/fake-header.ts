import { legacyFakeHeader, reactFakeHeader } from './fake-header-strings';
import { loadStyle } from './shared';

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

// async function getIdFromBackend(): Promise<string | null> {
//   const backend = callable<[], string>('GetSteamId');

//   return backend();
// }

export async function createFakeSteamHeader(): Promise<void> {
  const steamid = getIdFromAppConfig() ?? getIdFromScript(document);
  if (steamid === null) {
    throw new Error('Could not get steamid, augmented steam will not work.');
  }

  const isReactPage = document.querySelector('[data-react-nav-root]') !== null;

  let node: HTMLElement;
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

    node = document.createElement('header');
    node.innerHTML = reactFakeHeader.replaceAll('%user_id%', steamid).replaceAll('%img_src%', 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg');
    const pageContent = document.querySelector('#StoreTemplate');
    pageContent?.prepend(node);
  } else {
    node = document.createElement('div');
    node.innerHTML = legacyFakeHeader.replaceAll('%user_id%', steamid).replaceAll('%img_src%', 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg');
    const pageContent = document.querySelector('.responsive_page_content') ?? document.querySelector('.headerOverride');
    pageContent?.prepend(node);
  }

  const header = document.getElementById('global_header');

  if (header === null) {
    throw new Error('Could not find global header');
  }

  loadStyle('https://store.fastly.steamstatic.com/public/css/applications/store/greenenvelope.css');

  const showButton = document.createElement('button');
  showButton.style.position = 'fixed';
  showButton.style.top = '0';
  showButton.style.right = '0';
  showButton.style.display = 'none';
  showButton.style.zIndex = '9000';

  showButton.textContent = 'Show Header';

  showButton.addEventListener('click', () => {
    header.style.display = header.style.display === 'block' ? 'none' : 'block';
    showButton.textContent = header.style.display === 'block' ? 'Hide Header' : 'Show Header';
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

  node.appendChild(showButton);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}
