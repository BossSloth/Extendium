import { ExtendiumInfo } from '@extension/Metadata';
import { UserInfo } from '@extension/shared';
import { Millennium } from '@steambrew/client';
import { GetExtendiumInfo } from 'callables';
import { showExtensionInstallationFailedDialog } from 'extensionInstallationFailedDialog';
import { showLegacyExtensionDialog } from 'legacyExtensionDialog';
import { getUserInfoPromise, initInfos } from 'shared';
import { handleUrlScheme } from 'urlSchemeHandler';
import { OnPopupCreation } from './onPopupCreation';

let userInfo: UserInfo;

const global = {
  getUserInfo: (): string => JSON.stringify(userInfo),
  showExtensionInstallationFailedDialog,
  showLegacyExtensionDialog,
};
// @ts-expect-error ignore
Millennium.exposeObj(global);

// Entry point on the front end of your plugin
export default async function PluginMain(): Promise<void> {
  await App.WaitForServicesInitialized();
  SteamClient.URL.RegisterForRunSteamURL('extendium', handleUrlScheme);
  getUserInfoPromise().then((info) => {
    userInfo = info;
  });
  initInfos(JSON.parse(await GetExtendiumInfo()) as ExtendiumInfo);

  const wnd = g_PopupManager.GetExistingPopup('SP Desktop_uid0');
  if (wnd) {
    OnPopupCreation(wnd);
  }
  g_PopupManager.AddPopupCreatedCallback(OnPopupCreation);
}
