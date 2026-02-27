/** @fileoverview Definitions for chrome.developerPrivate API */

declare namespace chrome {
  namespace developerPrivate {
    export enum ExtensionType {
      HOSTED_APP = 'HOSTED_APP',
      PLATFORM_APP = 'PLATFORM_APP',
      LEGACY_PACKAGED_APP = 'LEGACY_PACKAGED_APP',
      EXTENSION = 'EXTENSION',
      THEME = 'THEME',
      SHARED_MODULE = 'SHARED_MODULE',
    }

    export enum Location {
      FROM_STORE = 'FROM_STORE',
      UNPACKED = 'UNPACKED',
      THIRD_PARTY = 'THIRD_PARTY',
      INSTALLED_BY_DEFAULT = 'INSTALLED_BY_DEFAULT',
      UNKNOWN = 'UNKNOWN',
    }

    export enum ViewType {
      APP_WINDOW = 'APP_WINDOW',
      BACKGROUND_CONTENTS = 'BACKGROUND_CONTENTS',
      COMPONENT = 'COMPONENT',
      EXTENSION_BACKGROUND_PAGE = 'EXTENSION_BACKGROUND_PAGE',
      EXTENSION_DIALOG = 'EXTENSION_DIALOG',
      EXTENSION_GUEST = 'EXTENSION_GUEST',
      EXTENSION_POPUP = 'EXTENSION_POPUP',
      EXTENSION_SERVICE_WORKER_BACKGROUND
        = 'EXTENSION_SERVICE_WORKER_BACKGROUND',
      TAB_CONTENTS = 'TAB_CONTENTS',
      EXTENSION_SIDE_PANEL = 'EXTENSION_SIDE_PANEL',
      DEVELOPER_TOOLS = 'DEVELOPER_TOOLS',
    }

    export enum ErrorType {
      MANIFEST = 'MANIFEST',
      RUNTIME = 'RUNTIME',
    }

    export enum ErrorLevel {
      LOG = 'LOG',
      WARN = 'WARN',
      ERROR = 'ERROR',
    }

    export enum ExtensionState {
      ENABLED = 'ENABLED',
      DISABLED = 'DISABLED',
      TERMINATED = 'TERMINATED',
      BLOCKLISTED = 'BLOCKLISTED',
    }

    export enum ComandScope {
      GLOBAL = 'GLOBAL',
      CHROME = 'CHROME',
    }

    export interface GetExtensionsInfoOptions {
      includeDisabled?: boolean;
      includeTerminated?: boolean;
    }

    export enum CommandScope {
      GLOBAL = 'GLOBAL',
      CHROME = 'CHROME',
    }

    export enum SafetyCheckWarningReason {
      UNPUBLISHED = 'UNPUBLISHED',
      POLICY = 'POLICY',
      MALWARE = 'MALWARE',
      OFFSTORE = 'OFFSTORE',
      UNWANTED = 'UNWANTED',
      NO_PRIVACY_PRACTICE = 'NO_PRIVACY_PRACTICE',
    }

    export interface AccessModifier {
      isActive: boolean;
      isEnabled: boolean;
    }

    export interface StackFrame {
      columnNumber: number;
      functionName: string;
      lineNumber: number;
      url: string;
    }

    export interface ManifestError {
      extensionId: string;
      fromIncognito: boolean;
      id: number;
      manifestKey: string;
      manifestSpecific?: string;
      message: string;
      source: string;
      type: ErrorType;
    }

    export interface RuntimeError {
      canInspect: boolean;
      contextUrl: string;
      extensionId: string;
      fromIncognito: boolean;
      id: number;
      isServiceWorker: boolean;
      message: string;
      occurrences: number;
      renderProcessId: number;
      renderViewId: number;
      severity: ErrorLevel;
      source: string;
      stackTrace: StackFrame[];
      type: ErrorType;
    }

    export interface DisableReasons {
      blockedByPolicy: boolean;
      corruptInstall: boolean;
      custodianApprovalRequired: boolean;
      parentDisabledPermissions: boolean;
      publishedInStoreRequired: boolean;
      reloading: boolean;
      suspiciousInstall: boolean;
      unsupportedDeveloperExtension: boolean;
      unsupportedManifestVersion: boolean;
      updateRequired: boolean;
    }

    export interface OptionsPage {
      openInTab: boolean;
      url: string;
    }

    export interface HomePage {
      specified: boolean;
      url: string;
    }

    export interface ExtensionView {
      incognito: boolean;
      isIframe: boolean;
      renderProcessId: number;
      renderViewId: number;
      type: ViewType;
      url: string;
    }

    export enum HostAccess {
      ON_CLICK = 'ON_CLICK',
      ON_SPECIFIC_SITES = 'ON_SPECIFIC_SITES',
      ON_ALL_SITES = 'ON_ALL_SITES',
    }

    export interface SafetyCheckStrings {
      detailString?: string;
      panelString?: string;
    }

    export interface ControlledInfo {
      text: string;
    }

    export interface Command {
      description: string;
      isActive: boolean;
      isExtensionAction: boolean;
      keybinding: string;
      name: string;
      scope: CommandScope;
    }

    export interface DependentExtension {
      id: string;
      name: string;
    }

    export interface Permission {
      message: string;
      submessages: string[];
    }

    export interface SiteControl {
      granted: boolean;
      host: string;
    }

    export interface RuntimeHostPermissions {
      hasAllHosts: boolean;
      hostAccess: HostAccess;
      hosts: SiteControl[];
    }

    export interface Permissions {
      runtimeHostPermissions?: RuntimeHostPermissions;
      simplePermissions: Permission[];
    }

    export interface ExtensionInfo {
      blocklistText?: string;
      canUploadAsAccountExtension: boolean;
      commands: Command[];
      controlledInfo?: ControlledInfo;
      dependentExtensions: DependentExtension[];
      description: string;
      didAcknowledgeMV2DeprecationNotice: boolean;
      disableReasons: DisableReasons;
      errorCollection: AccessModifier;
      fileAccess: AccessModifier;
      fileAccessPendingChange: boolean;
      homePage: HomePage;
      iconUrl: string;
      id: string;
      incognitoAccess: AccessModifier;
      incognitoAccessPendingChange: boolean;
      installWarnings: string[];
      isAffectedByMV2Deprecation: boolean;
      isCommandRegistrationHandledExternally: boolean;
      launchUrl?: string;
      location: Location;
      locationText?: string;
      manifestErrors: ManifestError[];
      manifestHomePageUrl: string;
      mustRemainInstalled: boolean;
      name: string;
      offlineEnabled: boolean;
      optionsPage?: OptionsPage;
      path?: string;
      permissions: Permissions;
      pinnedToToolbar?: boolean;
      prettifiedPath?: string;
      recommendationsUrl?: string;
      runtimeErrors: RuntimeError[];
      runtimeWarnings: string[];
      safetyCheckText?: SafetyCheckStrings;
      safetyCheckWarningReason: SafetyCheckWarningReason;
      showAccessRequestsInToolbar: boolean;
      showSafeBrowsingAllowlistWarning: boolean;
      state: `${ExtensionState}`;
      type: ExtensionType;
      updateUrl: string;
      userMayModify: boolean;
      userScriptsAccess: AccessModifier;
      version: string;
      views: ExtensionView[];
      webStoreUrl: string;
    }

    export interface ProfileInfo {
      canLoadUnpacked: boolean;
      inDeveloperMode: boolean;
      isChildAccount: boolean;
      isDeveloperModeControlledByPolicy: boolean;
      isIncognitoAvailable: boolean;
      isMv2DeprecationNoticeDismissed: boolean;
    }

    export interface ExtensionConfigurationUpdate {
      acknowledgeSafetyCheckWarningReason?: SafetyCheckWarningReason;
      errorCollection?: boolean;
      extensionId: string;
      fileAccess?: boolean;
      hostAccess?: HostAccess;
      incognitoAccess?: boolean;
      pinnedToToolbar?: boolean;
      showAccessRequestsInToolbar?: boolean;
      userScriptsAccess?: boolean;
    }

    export interface ProfileConfigurationUpdate {
      inDeveloperMode?: boolean;
      isMv2DeprecationNoticeDismissed?: boolean;
    }

    export interface ExtensionCommandUpdate {
      commandName: string;
      extensionId: string;
      keybinding?: string;
      scope?: CommandScope;
    }

    export interface ReloadOptions {
      failQuietly?: boolean;
      populateErrorForUnpacked?: boolean;
    }

    export interface LoadUnpackedOptions {
      failQuietly?: boolean;
      populateError?: boolean;
      retryGuid?: string;
      useDraggedPath?: boolean;
    }

    export enum PackStatus {
      SUCCESS = 'SUCCESS',
      ERROR = 'ERROR',
      WARNING = 'WARNING',
    }

    export enum FileType {
      LOAD = 'LOAD',
      PEM = 'PEM',
    }

    export enum SelectType {
      FILE = 'FILE',
      FOLDER = 'FOLDER',
    }

    export enum EventType {
      INSTALLED = 'INSTALLED',
      UNINSTALLED = 'UNINSTALLED',
      LOADED = 'LOADED',
      UNLOADED = 'UNLOADED',
      VIEW_REGISTERED = 'VIEW_REGISTERED',
      VIEW_UNREGISTERED = 'VIEW_UNREGISTERED',
      ERROR_ADDED = 'ERROR_ADDED',
      ERRORS_REMOVED = 'ERRORS_REMOVED',
      PREFS_CHANGED = 'PREFS_CHANGED',
      WARNINGS_CHANGED = 'WARNINGS_CHANGED',
      COMMAND_ADDED = 'COMMAND_ADDED',
      COMMAND_REMOVED = 'COMMAND_REMOVED',
      PERMISSIONS_CHANGED = 'PERMISSIONS_CHANGED',
      SERVICE_WORKER_STARTED = 'SERVICE_WORKER_STARTED',
      SERVICE_WORKER_STOPPED = 'SERVICE_WORKER_STOPPED',
      CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
      PINNED_ACTIONS_CHANGED = 'PINNED_ACTIONS_CHANGED',
    }

    export enum SiteSet {
      USER_PERMITTED = 'USER_PERMITTED',
      USER_RESTRICTED = 'USER_RESTRICTED',
      EXTENSION_SPECIFIED = 'EXTENSION_SPECIFIED',
    }

    export interface PackDirectoryResponse {
      item_path: string;
      message: string;
      override_flags: number;
      pem_path: string;
      status: PackStatus;
    }

    export interface EventData {
      event_type: EventType;
      extensionInfo?: ExtensionInfo;
      item_id: string;
    }

    export interface ErrorFileSource {
      afterHighlight: string;
      beforeHighlight: string;
      highlight: string;
    }

    export interface LoadError {
      error: string;
      path: string;
      retryGuid: string;
      source?: ErrorFileSource;
    }

    export interface RequestFileSourceProperties {
      extensionId: string;
      lineNumber?: number;
      manifestKey?: string;
      manifestSpecific?: string;
      message: string;
      pathSuffix: string;
    }

    export interface RequestFileSourceResponse {
      afterHighlight: string;
      beforeHighlight: string;
      highlight: string;
      message: string;
      title: string;
    }

    export interface OpenDevToolsProperties {
      columnNumber?: number;
      extensionId?: string;
      incognito?: boolean;
      isServiceWorker?: boolean;
      lineNumber?: number;
      renderProcessId: number;
      renderViewId: number;
      url?: string;
    }

    export interface DeleteExtensionErrorsProperties {
      errorIds?: number[];
      extensionId: string;
      type?: ErrorType;
    }

    export interface UserSiteSettings {
      permittedSites: string[];
      restrictedSites: string[];
    }

    export interface UserSiteSettingsOptions {
      hosts: string[];
      siteSet: SiteSet;
    }

    export interface SiteInfo {
      numExtensions: number;
      site: string;
      siteSet: SiteSet;
    }

    export interface SiteGroup {
      etldPlusOne: string;
      numExtensions: number;
      sites: SiteInfo[];
    }

    export interface MatchingExtensionInfo {
      canRequestAllSites: boolean;
      id: string;
      siteAccess: HostAccess;
    }

    export interface ExtensionSiteAccessUpdate {
      id: string;
      siteAccess: HostAccess;
    }

    export type VoidCallback = () => void;

    export type StringCallback = (s: string) => void;

    export function addHostPermission(extensionId: string, host: string):
    Promise<void>;
    export function autoUpdate(): Promise<void>;
    export function choosePath(selectType: SelectType, fileType: FileType):
    Promise<string>;
    export function deleteExtensionErrors(
      properties: DeleteExtensionErrorsProperties): Promise<void>;
    export function getExtensionsInfo(options: GetExtensionsInfoOptions):
    Promise<ExtensionInfo[]>;
    export function getExtensionSize(id: string): Promise<string>;
    export function getProfileConfiguration(): Promise<ProfileInfo>;
    export function installDroppedFile(): Promise<void>;
    export function loadUnpacked(options: LoadUnpackedOptions):
    Promise<LoadError | null>;
    export function notifyDragInstallInProgress(): void;
    export function openDevTools(properties: OpenDevToolsProperties):
    Promise<void>;
    export function packDirectory(
      path: string, privateKeyPath: string,
      flags?: number): Promise<PackDirectoryResponse>;
    export function reload(extensionId: string, options?: ReloadOptions):
    Promise<LoadError | null>;
    export function removeHostPermission(extensionId: string, host: string):
    Promise<void>;
    export function removeMultipleExtensions(extensionIds: string[]):
    Promise<void>;
    export function repairExtension(extensionId: string): Promise<void>;
    export function requestFileSource(properties:
    RequestFileSourceProperties):
    Promise<RequestFileSourceResponse>;
    export function setShortcutHandlingSuspended(isSuspended: boolean):
    Promise<void>;
    export function showOptions(extensionId: string): Promise<void>;
    export function showPath(extensionId: string): Promise<void>;
    export function updateExtensionCommand(update: ExtensionCommandUpdate):
    Promise<void>;
    export function updateExtensionConfiguration(
      update: ExtensionConfigurationUpdate): Promise<void>;
    export function updateProfileConfiguration(
      update: ProfileConfigurationUpdate): Promise<void>;
    export function getUserSiteSettings(): Promise<UserSiteSettings>;
    export function addUserSpecifiedSites(options: UserSiteSettingsOptions):
    Promise<void>;
    export function removeUserSpecifiedSites(
      options: UserSiteSettingsOptions): Promise<void>;
    export function getUserAndExtensionSitesByEtld(): Promise<SiteGroup[]>;
    export function getMatchingExtensionsForSite(site: string):
    Promise<MatchingExtensionInfo[]>;
    export function updateSiteAccess(
      site: string, updates: ExtensionSiteAccessUpdate[]): Promise<void>;
    export function dismissSafetyHubExtensionsMenuNotification(): void;
    export function dismissMv2DeprecationPanel(): void;
    export function dismissMv2DeprecationNoticeForExtension(
      extensionId: string): Promise<void>;
    export function uploadExtensionToAccount(extensionId: string):
    Promise<boolean>;
    export function showSiteSettings(extensionId: string): Promise<void>;

    export const onItemStateChanged: events.Event<(data: EventData) => void>;
    export const onProfileStateChanged:
    events.Event<(info: ProfileInfo) => void>;
    export const onUserSiteSettingsChanged:
    events.Event<(settings: UserSiteSettings) => void>;
  }
}
