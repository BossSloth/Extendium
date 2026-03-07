/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

(function () {
  /**
   * @param {number} ms
   *
   * @returns {Promise<any>}
   */
  async function sleep(ms) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @param {string} url
   */
  function loadStyle(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  function loadTooltips() {
    // @ts-ignore
    const jq = window.$J ?? window.$;
    if (jq?.('#global_header .supernav').v_tooltip !== undefined) {
      jq('#global_header .supernav').v_tooltip({
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
  }

  /**
   * @param {string} html
   * @param {boolean} isReactPage
   */
  async function createFakeSteamHeader(html, isReactPage) {
    let pageContent;

    if (isReactPage) {
      const start = performance.now();
      while (performance.now() - start < 5000) {
        // @ts-expect-error
        const root = window.SSR?.reactRoot?._internalRoot;
        if (root !== undefined) {
          break;
        }

        // eslint-disable-next-line no-await-in-loop
        await sleep(100);
      }

      if (performance.now() - start >= 5000) {
        console.error('Timed out waiting for react root');

        return;
      }

      pageContent = document.querySelector('#StoreTemplate');

      if (!pageContent) {
        console.error('Could not find page content');

        return;
      }

      pageContent.insertAdjacentHTML('afterbegin', html);
    } else {
      pageContent = document.querySelector('.responsive_page_content')
        ?? document.querySelector('.headerOverride')
        ?? document.querySelector('center');

      if (pageContent) {
        pageContent.insertAdjacentHTML('afterbegin', html);
      }
    }

    const header = document.getElementById('global_header');

    if (header === null) {
      console.error('Could not find global header');

      return;
    }

    header.style.display = 'block';

    const headerContent = /** @type {HTMLElement} */ (header.firstElementChild);
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

    if (pageContent) {
      pageContent.prepend(showButton);
    }

    if (!isReactPage) {
      loadTooltips();
    }

    document.dispatchEvent(new Event('headerReady'));
  }

  /**
   * @param {() => void} callback
   */
  function onDomReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // Wait for the isolated world script to provide the HTML data
  document.addEventListener('extendiumFakeHeaderDataReady', () => {
    onDomReady(() => {
      const html = document.documentElement.getAttribute('data-extendium-fake-header-html');
      const isReactPage = document.documentElement.getAttribute('data-extendium-fake-header-is-react') === 'true';

      if (html !== null) {
        createFakeSteamHeader(html, isReactPage);
        // Clean up data attributes
        document.documentElement.removeAttribute('data-extendium-fake-header-html');
        document.documentElement.removeAttribute('data-extendium-fake-header-is-react');
      }
    });
  });
})();
