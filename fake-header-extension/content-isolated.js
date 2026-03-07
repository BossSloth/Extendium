/* eslint-disable no-undef */
/* eslint-disable func-names */
(function () {
  /**
   * @typedef {{ userId: string; personaName: string; avatarUrl: string; accountBalance: string; }} UserInfo
   */

  const mockUserInfo = {
    userId: '76561198000000000',
    personaName: 'ExampleUser',
    avatarUrl: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    accountBalance: '10,00€',
  };

  /**
   * @param {string} str
   * @param {UserInfo} userInfo
   *
   * @returns {string}
   */
  function replaceKeys(str, userInfo) {
    return str
      .replaceAll('%user_id%', userInfo.userId)
      .replaceAll('%persona_name%', userInfo.personaName)
      .replaceAll('%img_src%', userInfo.avatarUrl)
      .replaceAll('%account_balance%', userInfo.accountBalance);
  }

  async function loadAndInjectTemplates() {
    const isReactPage = document.querySelector('[data-react-nav-root]') !== null;

    let htmlTemplate;

    if (isReactPage) {
      const response = await fetch(chrome.runtime.getURL('react-header.html'));
      htmlTemplate = await response.text();
    } else {
      const response = await fetch(chrome.runtime.getURL('legacy-header.html'));
      htmlTemplate = await response.text();
    }

    const html = replaceKeys(htmlTemplate, mockUserInfo);

    // Store data in a data attribute on the document element
    document.documentElement.setAttribute('data-extendium-fake-header-html', html);
    document.documentElement.setAttribute('data-extendium-fake-header-is-react', String(isReactPage));

    // Dispatch event to notify MAIN world script
    document.dispatchEvent(new CustomEvent('extendiumFakeHeaderDataReady'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndInjectTemplates);
  } else {
    loadAndInjectTemplates();
  }
})();
