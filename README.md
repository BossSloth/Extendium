# Extendium

A Millennium plugin that adds chrome extensions support to the steam client
> [!IMPORTANT]
> This plugin is still in development and will not work as expected
> The README is not up to date or correct

## Compatibility
Want to know if your favorite chrome extension is compatible with Extendium? Check [here](https://docs.google.com/spreadsheets/d/e/2PACX-1vRDoTrxtBhLurvlxZNW7vYpUtp-dU4iyRgS3GnVKjXx2seONwU_BtORtDoE8WbbrRp0-OohYI2NAM-j/pubhtml) on the compatibility list

## Features
- TODO: proper description some information is wrong


## Installation
1. Ensure you have Millennium installed on your Steam client
2. Download the [latest release](https://github.com/BossSloth/Extendium/releases/latest) of this plugin from GitHub or from the [Steambrew](https://steambrew.app/plugins) website
3. Place the plugin files in your Millennium plugins directory (should be a plugins folder in your Steam client directory)
4. Restart your Steam client
5. Enable the Extendium plugin in the Millennium plugin menu
6. Save changes at the top of the Millennium plugin menu and restart Steam

## Usage

Once installed it should just work out of the box.

## Known features that are currently not supported
- context menus
- alarms
- notifications
- permission control
- global keyboard shortcuts
- anything to do with tabs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Steps on how to set up the project

> It is recommended to put the plugin repository in your Steam plugins folder or make some symbolic links to the
> repository for easier development.

1. Clone the repository using `git clone https://github.com/BossSloth/Extendium.git`
2. Run `bun install` or use your favorite package manager
3. Now you can run `bun watch` or `bun dev` to build the plugin and watch for changes

> Note: `bun dev` will only watch for changes in the webkit and frontend folder and the scss file, to reload the plugin just press `F5` in the steam client to reload
> For changes to the backend, you will need to fully restart the Steam client.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
