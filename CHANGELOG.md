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
