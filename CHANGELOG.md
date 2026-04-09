## [2.0.1](https://github.com/BossSloth/Extendium/compare/v2.0.0...v2.0.1) (2026-04-09)


### Bug Fixes

* Fixed extendium not working on the latest millennium beta (requires beta.20) ([b6afd2c](https://github.com/BossSloth/Extendium/commit/b6afd2c3b0f9a4b41205b68e2804146b688626f3))

# [2.0.0](https://github.com/BossSloth/Extendium/compare/v1.1.1...v2.0.0) (2026-04-04)


### Bug Fixes

* Empty external links breaking the settings menu, we now parse the external links twice ([4adb41d](https://github.com/BossSloth/Extendium/commit/4adb41d2ab6c8b45c1808d8e7d993889e76c3427))
* Fixed all non link buttons like "Add to cart" not working ([f78cd6b](https://github.com/BossSloth/Extendium/commit/f78cd6b9f093a9f9b5060799b26299c1da2806fd))
* Fixed external links no longer working in webkit ([2708abc](https://github.com/BossSloth/Extendium/commit/2708abcaa57cfa51a43537e51d4aff1b79472b6d))
* no longer use libcrypto library but use own hmac implementation ([328e3f4](https://github.com/BossSloth/Extendium/commit/328e3f4cd76c018b3ae71030b7f6669ef2880369))
* storage manager crashing steam ([75d48b1](https://github.com/BossSloth/Extendium/commit/75d48b1415bfd7534331a719eb812561373b98cd))
* toolbar context menu not being styled by themes ([d5d9c52](https://github.com/BossSloth/Extendium/commit/d5d9c52c32d9acc55ab47cc8fb9d593831d70217))


### chore

* prepare for release by updating readme with info for 2.0 ([8d6b56a](https://github.com/BossSloth/Extendium/commit/8d6b56a060d77a8e3716bdace011959d74832e1e))


### Features

* add quick buttons to open extensions store and extensions page ([6eac90a](https://github.com/BossSloth/Extendium/commit/6eac90a73c820156839ee081c50dccbd8367966d))
* Added compatibility status indicators with link to compatibility list ([307b97c](https://github.com/BossSloth/Extendium/commit/307b97c0554b7542eb123cf6ae564e80bcad61b8))
* added setting to always open links in current tab instead of new window or external ([6051397](https://github.com/BossSloth/Extendium/commit/605139715120cf7cf19f45210a642b0395750a38))
* added uninstall button to context extension menu ([36c1fde](https://github.com/BossSloth/Extendium/commit/36c1fdef3d4fbf31ad7b8255f5018a53b5e140ac))
* first working version of automatic installation of internal extension ([2be18ef](https://github.com/BossSloth/Extendium/commit/2be18efda2310c9852c2d57eb88341d5d0a90bec))
* fully port to lua and get rid of old way of managing extensions now fully using chrome's native extensions ([3b0b9c7](https://github.com/BossSloth/Extendium/commit/3b0b9c75642d806c1f2934da114f5058f51cc6e1))
* implement native extension action popups in the steamclient with BrowserViews ([95bf007](https://github.com/BossSloth/Extendium/commit/95bf00769645e04d751cdb5c28311fd7d107debc))
* prevent installation of broken extensions like tampermonkey to prevent bricking steam ([845de1e](https://github.com/BossSloth/Extendium/commit/845de1e6e4f4e27f60e52faf986007cefbf0bc64))
* removed storage manager as it is no longer needed ([0f1e99b](https://github.com/BossSloth/Extendium/commit/0f1e99b1c04f3264827b96f0035ce23771618b22))
* Show dialog on startup to migrate from old legacy extensions ([589b5dd](https://github.com/BossSloth/Extendium/commit/589b5dda5658e901a9eab520de4caf5048fac932))
* Show error dialog of automatic installation of internal extension failed ([72f52e7](https://github.com/BossSloth/Extendium/commit/72f52e7aed0754164cfca91e5d87b56d7e4dfd7b))
* working options page with new native extensions and sync enabled state better ([a9e4968](https://github.com/BossSloth/Extendium/commit/a9e4968b23f96072acc86d9951ccf878035ade09))


### BREAKING CHANGES

* Extendium has been fully rewritten all previously installed extensions and extension settings no longer work with 2.0 and will need to be migrated

## [1.1.1](https://github.com/BossSloth/Extendium/compare/v1.1.0...v1.1.1) (2025-12-19)


### Bug Fixes

* Added websockets to requirements ([#44](https://github.com/BossSloth/Extendium/issues/44)). Closes [#28](https://github.com/BossSloth/Extendium/issues/28), Closes [#42](https://github.com/BossSloth/Extendium/issues/42), Closes [#43](https://github.com/BossSloth/Extendium/issues/43) ([51933b6](https://github.com/BossSloth/Extendium/commit/51933b6efd3417dbee284fe0df6a55eb27620edf))

# [1.1.0](https://github.com/BossSloth/Extendium/compare/v1.0.3...v1.1.0) (2025-12-03)


### Bug Fixes

* add fallback to higher Chrome version when extension has a minimum chrome version like stylus, closes [#32](https://github.com/BossSloth/Extendium/issues/32) ([f05018a](https://github.com/BossSloth/Extendium/commit/f05018a1fd9cadc5273729ac550d54e26f70dc69))
* catch errors extension initialization to not break the extension bar ([a827418](https://github.com/BossSloth/Extendium/commit/a827418e7c46fe379da8744b4390c1d826fff4d2))
* Fixed extensions not finding updates if chrome page was not in english ([de2420f](https://github.com/BossSloth/Extendium/commit/de2420f65e146178dad268be35afd8d4daadc822))
* properly shutdown plugin when unloading ([6b4f757](https://github.com/BossSloth/Extendium/commit/6b4f7571268ff49fbbf4aae8ac76e6e1a0eccdf2))
* try making getUserInfo more reliable, should prevent less random fails on launch ([59d74e3](https://github.com/BossSloth/Extendium/commit/59d74e3fb02cedeb30948c7dc9b5c75c6cb9e709))


### Features

* add chrome.runtime.lastError property to both frontend and webkit implementations ([fceded0](https://github.com/BossSloth/Extendium/commit/fceded0cd95c1f03d3da55e5df08188b583c9d10))
* add current account balance to fake header ([6f0cf8e](https://github.com/BossSloth/Extendium/commit/6f0cf8e80523b076a14eaea1ae4d0591b7ca5414))
* add safe proxy wrapper for chrome API to improve error logging on unhandled api calls ([5dab17e](https://github.com/BossSloth/Extendium/commit/5dab17e1673a64f5150b7427ea2b116bedc1f232))
* implement extension onInstalled events and handle create tab option page ([2e69ea3](https://github.com/BossSloth/Extendium/commit/2e69ea3ff66b289c7ee9cdacd265a814c7d297ba))

## [1.0.3](https://github.com/BossSloth/Extendium/compare/v1.0.2...v1.0.3) (2025-10-06)


### Bug Fixes

* Detect more links to open as options menu ([ca1fe0b](https://github.com/BossSloth/Extendium/commit/ca1fe0b0e2892b756ec49da8c34f6f8dfbfdf6dd))
* Disabled fake header on steam news page as steam does some weird things on that page if the header is present, closes [#18](https://github.com/BossSloth/Extendium/issues/18) ([33c747e](https://github.com/BossSloth/Extendium/commit/33c747e163f0e91480f145da039e7e1a1976d9e6))
* Fixed extendium giving back the wrong locale if the current language had a sub tag like `pt-br` or `zh-cn`. This should fix some extensions that would previously not work with these languages ([e70b1b1](https://github.com/BossSloth/Extendium/commit/e70b1b1640de436a33f7fa1b430baa2c0d929db4))
* Fixed extension button sometimes disspearing when extendium fails to get some user data ([bb3c3b7](https://github.com/BossSloth/Extendium/commit/bb3c3b76a3315650f2ef72947941b2ff0621eff8))

## [1.0.2](https://github.com/BossSloth/Extendium/compare/v1.0.1...v1.0.2) (2025-10-05)


### Bug Fixes

* Fixed puzzle icon sometimes not appearing and fixed undefined 'innerHeight' error, closes [#12](https://github.com/BossSloth/Extendium/issues/12), closes [#17](https://github.com/BossSloth/Extendium/issues/17) ([913a0be](https://github.com/BossSloth/Extendium/commit/913a0beda6a4d791f524823f4646f328b7abe0a8))

## [1.0.1](https://github.com/BossSloth/Extendium/compare/v1.0.0...v1.0.1) (2025-09-28)


### Bug Fixes

* controller input not working in BPM by updating @steambrew/ttc, closes [#13](https://github.com/BossSloth/Extendium/issues/13) ([57b3734](https://github.com/BossSloth/Extendium/commit/57b3734378c4b71807b4afdb58db7f5ceb266f00))
