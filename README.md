# Extendium

A Millennium plugin that brings the power of Chrome extensions to your Steam client.

> [!IMPORTANT]
> Extendium is under active development. While many extensions work, some APIs may not behave exactly like they do in Chrome. Please check the compatibility list and open an issue if you encounter problems or missing features.

## Compatibility

Wondering if your favorite Chrome extension works with Extendium? Check our official **[Compatibility List](https://docs.google.com/spreadsheets/d/e/2PACX-1vRDoTrxtBhLurvlxZNW7vYpUtp-dU4iyRgS3GnVKjXx2seONwU_BtORtDoE8WbbrRp0-OohYI2NAM-j/pubhtml)**.

## Features

-   **Install from Chrome Web Store**: Seamlessly install extensions directly from a web store URL.
-   **Extensions Manager**: A central hub to manage your extensions with actions like Install, Manage Storage, Browse Local Files, and configure Settings.
-   **Toolbar and Menu**: Access your extensions via the puzzle icon next to the address bar. Pin your favorites to the toolbar or right-click for more options.
-   **Automatic Updates**: Get notified when an update is available and install it with a single click.
-   **Steam Web Header**: Hold `Ctrl` and click `Show Header` in the top right to reveal the Steam web header for advanced usage.

## Installation

1.  Ensure you have **Millennium** installed on your Steam client.
2.  Download the **[latest release](https://github.com/BossSloth/Extendium/releases/latest)** from GitHub or from the **[Steambrew](https://steambrew.app/plugin?id=788ed8554492)** website.
3.  Place the plugin files into your Millennium plugins directory (typically a `plugins` folder inside your Steam installation).
4.  **Restart** your Steam client.
5.  Open the Millennium plugin menu and **enable** the Extendium plugin.
6.  Click **Save Changes** at the top of the menu and **restart Steam** one more time.

## Usage

Here's how to get started with installing and managing extensions in Steam.
Or just follow this gif.

![Usage gif](images/install-extension.gif)

#### __1. Open the Extensions Menu__

-   Click the **puzzle icon** to the right of the address bar to open the extensions menu.

    *Default Skin:*
    ![Extensions puzzle icon next to the address bar](images/extension-icon.png)

    *Fluenty Skin:*
    ![Extensions puzzle icon next to the address bar with Fluenty skin](images/extension-icon-fluenty.png)

> [!NOTE]
> Can't find the puzzle icon? You can launch the manager directly by typing `steam://extendium/manager` in your browser or running it with `Win + R`. If it's still missing, try switching to the default Steam skin or adjusting the margins in the settings.

-   From the menu, click **Manage extensions** to open the Extensions Manager.


#### __2. Install an Extension from the Chrome Web Store__

1.  In the Extensions Manager, click the **Install extension** button.
2.  Paste the full Chrome Web Store URL of the desired extension.
    -   *Example*: `https://chromewebstore.google.com/detail/steamdb/kdbmhfkmnlmbkgbabkdealhhbfhlmmon`
3.  Click **Install** and wait for the download to complete.
4.  When prompted, click **Restart Now** to activate the extension.

#### __3. Access and Manage Your Extensions__

-   **Extension Toolbar**: After restarting, installed extensions will appear in the extensions menu where you can pin them to the toolbar. Left-click an icon to open its action, or right-click for more options.

-   **Management Actions**: In the Extensions Manager, each extension has a card with the following actions:
    -   **Details**: View the extension's name, version, description, and error logs.
    -   **Update**: If an update is available, a green button will appear. Click it to download the new version and restart.
    -   **Remove**: Uninstall the extension. A restart will be required.

-   **Global Actions** (in the top toolbar):
    -   **Manage Storage**: Inspect and clear storage used by extensions. Useful for resetting a misbehaving extension.
    -   **Browse Local Files**: Opens the folder where your extensions are installed.

#### __4. Configure External Links__

By default, all links open inside the Steam client. You can force certain URLs to open in your default web browser.

1.  Go to **Extensions Manager** > **Settings** (cog icon).
2.  In the **External Links** section, add a URL pattern to open externally (e.g., `youtube.com`).
3.  You can use simple text or check the **Regex** box for advanced matching.

## Troubleshooting

-   **Installation Fails**: Check the logs in the Extension Manager, verify your internet connection, and ensure you can access the Chrome Web Store. If it persists, please file a bug report.
-   **Puzzle Icon is Missing**: Ensure Extendium is enabled in the Millennium menu and that you clicked **Save Changes** and restarted. Skin compatibility issues can also hide the icon.
-   **Extension Not Working**: Check the **[Compatibility List](https://docs.google.com/spreadsheets/d/e/2PACX-1vRDoTrxtBhLurvlxZNW7vYpUtp-dU4iyRgS3GnVKjXx2seONwU_BtORtDoE8WbbrRp0-OohYI2NAM-j/pubhtml)** first. If it's listed as compatible, try resetting its storage or reinstalling it. If the issue continues, open an **Extension Issue** on GitHub.

### Manual Extension Installation

If you wish to install an extension manually for example, if you cannot access the Chrome Web Store or want to install a development version, follow these steps.

1.  **Download the Extension Files**
    -   Download the extension as a `.crx` file or as a `.zip` archive containing the extension files.

2.  **Locate the Extensions Folder**
    -   The easiest method is to open the **Extensions Manager** and click the **Browse local files** button.
    -   Alternatively, navigate manually to `{SteamPath}/plugins/extendium/.extensions`.
    -   If the `.extensions` folder doesn't exist, create it.

3.  **Create a Folder for the Extension**
    -   Inside the `.extensions` folder, create a new folder. The name of this folder will be the internal identifier for the extension (e.g., `my-extension`).

4.  **Extract the Extension Files**
    -   Extract the contents of the `.crx` or `.zip` file into the new folder you just created.
    -   > **Tip**: A `.crx` file is just a renamed `.zip` file. If you can't extract it directly, rename the file extension from `.crx` to `.zip`.

5.  **Restart Steam**
    -   Fully restart the Steam client. The manually installed extension should now appear in your extensions list.

> [!WARNING]
> Manually installed extensions will show a `Reinstall required` warning. This is because they are missing the update metadata that is normally fetched from the Chrome Web Store. You can safely ignore this warning, but be aware that the extension will **not** receive automatic updates.

## Known Limitations

Extendium is still evolving, and some Chrome extension features are not yet supported:

-   Context Menus
-   Alarms
-   Notifications
-   Permission Controls
-   Global Keyboard Shortcuts
-   Tab-related APIs (`chrome.tabs`)

## Reporting Issues

Encountered a bug or have a feature request? Please **[open an issue on GitHub](https://github.com/BossSloth/Extendium/issues/new/choose)**. Using the correct template helps us resolve problems faster.

-   **Bug Report**: Use this if you've found a problem with Extendium itself, such as a UI glitch, a problem with the extension manager, or a backend error. This is for bugs that are not specific to a single Chrome extension.

-   **Extension Issue**: If a specific Chrome extension isn't working as expected (e.g., it won't install, its features are broken, or it's causing errors), please use this template.

-   **Extension Request**: Use this template for two main purposes:
    1.  To request support for a Chrome extension that is not yet compatible with Extendium.
    2.  To report that an extension works correctly but is not yet on the [compatibility list](https://docs.google.com/spreadsheets/d/e/2PACX-1vRDoTrxtBhLurvlxZNW7vYpUtp-dU4iyRgS3GnVKjXx2seONwU_BtORtDoE8WbbrRp0-OohYI2NAM-j/pubhtml). Your contributions help us keep the list up-to-date for everyone!

## Backend Services

Extendium runs two local backend services to enhance functionality:

-   **WebSocket Server** (Port `8791`): Facilitates real-time communication for advanced extension features.
-   **CORS Proxy** (Port `8792`): Helps extensions make web requests that would otherwise be blocked by browser security policies.

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue to discuss your ideas.

### Development Setup

> **Tip**: For easier development, place the plugin repository directly in your Steam plugins folder or use a symbolic link.

1.  Clone the repository: `git clone https://github.com/BossSloth/Extendium.git`
2.  Install dependencies: `bun install`
3.  Start the development server: `bun dev`
4.  Reload the UI in Steam by pressing `F5` while in `-dev` mode.

> For changes to the `backend/`, a full restart of the Steam client is required.

### Build Scripts

-   `bun dev`: Runs the Millennium toolchain in dev mode for fast rebuilds.
-   `bun watch`: Watches all source folders and automatically rebuilds on changes.
-   `bun build`: Creates a production-ready build.

### Project structure
- `frontend/` - UI, extension manager, toolbar button, URL handling, and main window patches. Pretty much everything to do with the Steam UI
- `shared/` - Shared TypeScript utilities and types used across the plugin (e.g., Chrome API shims).
- `webkit/` - WebKit-specific logic and request handling for the Steam client. This is loaded in on web pages.
- `public/` - Static assets and styles. `extendium.scss` compiles to `extendium.css`.
- `backend/` - Backend helpers (e.g., WebSocket server, CORS proxy) for advanced features.
- `.millennium/Dist/` - Build output generated by the Millennium toolchain.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
