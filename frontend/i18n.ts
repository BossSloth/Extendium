import { useSettingsStore } from './extensions-manager/Settings/settingsStore';

export const translations = {
  en: {
    // ExtensionManagerComponent
    details: 'Details',
    remove: 'Remove',
    clickForCompList: 'Compatibility: {compatibility}, click for compatibility list',
    
    // ExtensionDetailInfo
    errorInExtension: 'Error in extension',
    description: 'Description',
    version: 'Version',
    id: 'Id',
    inspectViews: 'Inspect views',
    errors: 'Errors',
    errorInstructions: 'For detailed error information, {devmodeLink} and open the console of the specified view in the list above',
    enableDevModeText: 'enable dev mode',
    extensionOptions: 'Extension options',
    removeExtension: 'Remove extension',
    
    // ExtensionManagerRoot
    installExtension: 'Install extension',
    advancedExtManagement: 'Advanced extension management',
    
    // ExtensionManagerPopup
    extensions: 'Extensions',
    undefinedRoute: 'Error you somehow got to an undefined route "{route}" please report this.',
    
    // ExtendiumSettings
    settingsTitle: 'Extendium Settings',
    settingsDesc: 'If the extension bar is covered up by other buttons or you want to move it you can change the margin here',
    marginRight: 'Margin right',
    marginLeft: 'Margin left',
    showCompPillsLabel: 'Show compatibility status pills next to extension names in the extension manager',
    showCompPillsSpan: 'Show compatibility pills',
    openLinksLabel: 'Always open links in current tab on left click (ignores target blank)',
    openLinksSpan: 'Open in current tab',
    languageLabel: 'UI Language',
    languageDesc: 'Choose the language used for the Extendium plugin user interface',
    langAuto: 'Auto (Steam System)',
    langEn: 'English',
    langJa: '日本語',
    
    // DynamicListManager
    extLinksTitle: 'External links',
    extLinksDesc: 'Manage URL patterns that should always open in an external browser. For each entry, provide a string to match against the URL. If \'Regex\' is checked, the string is treated as a regular expression. Otherwise, it performs a simple case sensitive text search.',
    extLinksPlaceholder: 'Paste or type a link…',
    extLinksAdd: 'Add link',
    extLinksEmpty: 'No links yet.',
    extLinksRemove: 'Remove',
    extLinksRegex: 'Regex',
    extLinksRegexTooltip: 'Treat match as a regular expression',
    
    // ExtensionContextMenu
    unpin: 'Unpin',
    manage: 'Manage',
    options: 'Options',
    
    // ToolbarManagerContextMenu & ManagerExtensionItem
    pin: 'Pin',
    manageExtensions: 'Manage extensions',
    
    // extensionInstallationFailedDialog
    failedTitle: 'Extendium installation failed',
    failedDesc1: 'Extendium needs a helper extension to work fully, but the automatic installation didn\'t complete successfully.',
    failedDesc2: 'Without the helper extension, some extensions like Augmented Steam won\'t work properly.',
    failedDesc3: 'You can try the automatic installation again, or manually install the helper extension by following the step-by-step instructions in the readme {readmeLink}.',
    here: 'here',
    failedDesc4: 'If the problem persists, please check the plugin logs for more details and report this issue on the {githubLink} or the {discordLink} with your log.',
    githubRepo: 'Extendium GitHub repository',
    discordChannel: 'discord channel',
    tryAgain: 'Try installation again',
    ignoreBtn: 'Ignore and don\'t show again',
    understoodBtn: 'Understood, I will manually install it',
    
    // extensionInitialization
    unsupportedTitle: 'Unsupported extension installed',
    unsupportedDesc1: 'We\'ve automatically detected an extension ({extensionName}:{extensionId}) that is known to cause Steam to become unresponsive, crash or become fully bricked.',
    unsupportedDesc2: 'You WILL NEED to remove this extension to prevent potential issues with your Steam client.',
    unsupportedDesc3: 'You can find more information about compatible extensions on the Extendium github page.',
    uninstallBtn: 'Uninstall extension',
    
    // legacyExtensionDialog
    legacyTitle: 'Legacy Extendium Extensions Detected',
    legacyDesc: 'The following extensions were found in Extendium\'s .extensions folder. These were previously installed using Extendium\'s old installation method and will no longer work.',
    legacyReinstall: 'Please reinstall them from the Chrome Web Store to ensure they function correctly.',
    legacyDeleteInstruction: 'To not show this dialog again use the "Delete All" button below to delete all legacy extensions.',
    openInWebStore: 'Open in Chrome Web Store',
    manuallyInstalled: 'Manually installed (no web store link)',
    deleteConfirmTitle: 'Delete All Legacy Extensions?',
    deleteConfirmDesc: 'Are you sure you want to delete all legacy extension folders? This action cannot be undone.',
    deleteAllBtn: 'Delete All',
    deletedTitle: 'Legacy Extensions Deleted',
    deletedDesc: 'All legacy extension folders have been deleted.',
    okBtn: 'OK',
    openAllInWebStore: 'Open All in Web Store',
    closeBtn: 'Close',
  },
  ja: {
    // ExtensionManagerComponent
    details: '詳細',
    remove: '削除',
    clickForCompList: '互換性: {compatibility}。クリックして互換性リストを開く',
    
    // ExtensionDetailInfo
    errorInExtension: '拡張機能のエラー',
    description: '説明',
    version: 'バージョン',
    id: 'ID',
    inspectViews: 'ビューを検査',
    errors: 'エラー',
    errorInstructions: '詳細なエラー情報は、{devmodeLink}し、上記のリストの指定されたビューのコンソールを開いてください。',
    enableDevModeText: '開発者モードを有効',
    extensionOptions: '拡張機能のオプション',
    removeExtension: '拡張機能を削除',
    
    // ExtensionManagerRoot
    installExtension: '拡張機能をインストール',
    advancedExtManagement: '高度な拡張機能管理',
    
    // ExtensionManagerPopup
    extensions: '拡張機能',
    undefinedRoute: 'エラー: 未定義のルート "{route}" に到達しました。この問題を報告してください。',
    
    // ExtendiumSettings
    settingsTitle: 'Extendiumの設定',
    settingsDesc: '拡張機能バーが他のボタンで隠れてしまう場合や、位置を調整したい場合は、ここで余白を変更できます。',
    marginRight: '右の余白',
    marginLeft: '左の余白',
    showCompPillsLabel: '拡張機能の管理で拡張機能名の横に互換性のステータスバッジを表示',
    showCompPillsSpan: '互換性バッジを表示する',
    openLinksLabel: '左クリック時に常に現在のタブでリンクを開く（target="_blank" を無視）',
    openLinksSpan: '現在のタブで開く',
    languageLabel: 'UIの言語',
    languageDesc: 'Extendiumプラグインのユーザーインターフェースで使用する言語を選択します',
    langAuto: '自動 (Steamの言語)',
    langEn: 'English',
    langJa: '日本語',
    
    // DynamicListManager
    extLinksTitle: '外部リンク',
    extLinksDesc: '常に外部ブラウザーで開くべきURLパターンを管理します。各エントリについて、URLと照合する文字列を指定してください。「Regex」がチェックされている場合、文字列は正規表現として扱われます。それ以外の場合は、単純な大文字小文字を区別するテキスト検索が行われます。',
    extLinksPlaceholder: 'リンクを貼り付け、または入力...',
    extLinksAdd: 'リンクを追加',
    extLinksEmpty: 'リンクはまだありません。',
    extLinksRemove: '削除',
    extLinksRegex: '正規表現',
    extLinksRegexTooltip: 'パターンを正規表現として扱います',
    
    // ExtensionContextMenu
    unpin: 'ピン留めを外す',
    manage: '管理',
    options: 'オプション',
    
    // ToolbarManagerContextMenu & ManagerExtensionItem
    pin: 'ピン留めする',
    manageExtensions: '拡張機能を管理',
    
    // extensionInstallationFailedDialog
    failedTitle: 'Extendiumのインストールに失敗しました',
    failedDesc1: 'Extendiumを完全に動作させるにはヘルパー拡張機能が必要ですが、自動インストールが正常に完了しませんでした。',
    failedDesc2: 'ヘルパー拡張機能がないと、Augmented Steam などの一部の拡張機能が正常に動作しません。',
    failedDesc3: '自動インストールを再試行するか、{readmeLink}のREADMEにあるステップバイステップの手順に従ってヘルパー拡張機能を手動でインストールしてください。',
    here: 'こちら',
    failedDesc4: '問題が解決しない場合は、プラグインのログで詳細を確認し、ログを添えて{githubLink}または{discordLink}でこの問題を報告してください。',
    githubRepo: 'ExtendiumのGitHubリポジトリ',
    discordChannel: 'Discordチャンネル',
    tryAgain: 'インストールを再試行',
    ignoreBtn: '無視して再表示しない',
    understoodBtn: '理解しました。手動でインストールします。',
    
    // extensionInitialization
    unsupportedTitle: 'サポートされていない拡張機能がインストールされました',
    unsupportedDesc1: 'Steamが応答しなくなったり、クラッシュしたり、完全に動作しなくなったり（ブリック）することが知られている拡張機能 ({extensionName}:{extensionId}) が自動的に検出されました。',
    unsupportedDesc2: 'Steamクライアントの潜在的な問題を回避するために、この拡張機能を削除する必要があります。',
    unsupportedDesc3: '互換性のある拡張機能に関する詳細情報は、ExtendiumのGitHubページで確認できます。',
    uninstallBtn: '拡張機能をアンインストール',
    
    // legacyExtensionDialog
    legacyTitle: '古いExtendium拡張機能を検出しました',
    legacyDesc: '以下の拡張機能がExtendiumの「.extensions」フォルダー内に見つかりました。これらは以前のExtendiumの古いインストール方法でインストールされたため、現在は動作しません。',
    legacyReinstall: '正常に動作させるために、Chromeウェブストアから再インストールしてください。',
    legacyDeleteInstruction: 'このダイアログを再表示しないようにするには、下の「すべて削除」ボタンを使用して古い拡張機能をすべて削除してください。',
    openInWebStore: 'Chrome ウェブストアで開く',
    manuallyInstalled: '手動インストール（ウェブストアのリンクなし）',
    deleteConfirmTitle: '古い拡張機能をすべて削除しますか？',
    deleteConfirmDesc: '古い拡張機能のフォルダーをすべて削除してもよろしいですか？この操作は取り消せません。',
    deleteAllBtn: 'すべて削除',
    deletedTitle: '古い拡張機能を削除しました',
    deletedDesc: 'すべての古い拡張機能フォルダーが削除されました。',
    okBtn: 'OK',
    openAllInWebStore: 'すべてウェブストアで開く',
    closeBtn: '閉じる',
  }
};

export type TranslationKey = keyof typeof translations.en;

export function getLanguage(): 'en' | 'ja' {
  const storeLanguage = useSettingsStore.getState().language;
  if (storeLanguage === 'en') return 'en';
  if (storeLanguage === 'ja') return 'ja';
  
  // Auto-detect based on navigator.language
  const lang = navigator.language || '';
  if (lang.toLowerCase().startsWith('ja')) {
    return 'ja';
  }
  return 'en';
}

export function t(key: TranslationKey): string {
  const lang = getLanguage();
  return translations[lang][key] || translations.en[key] || String(key);
}
