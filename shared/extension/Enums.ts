// Taken from @types/chrome/index.d.ts

export enum OnInstalledReason {
  /** Specifies the event reason as an installation. */
  INSTALL = 'install',
  /** Specifies the event reason as an extension update. */
  UPDATE = 'update',
  /** Specifies the event reason as a Chrome update. */
  CHROME_UPDATE = 'chrome_update',
  /** Specifies the event reason as an update to a shared module. */
  SHARED_MODULE_UPDATE = 'shared_module_update',
}
