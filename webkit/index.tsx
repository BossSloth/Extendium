import { ExtendiumInfo } from '@extension/Metadata';
import { callable } from '@steambrew/webkit';
import { ExtensionWrapper } from './ExtensionWrapper';
import { linkClickInterceptor } from './linkModifier';

/** @returns json serialized {@link ExtendiumInfo} */
export const GetExtendiumInfo = callable<[], string>('GetExtendiumInfo');

const extensions = new Map<string, ExtensionWrapper>();
window.extensions = extensions;

export default async function WebkitMain(): Promise<void> {
  // Add fake header to steam pages
  // TODO: move this to the backend with a custom millennium function
  // if (isSteamPage() && !window.location.href.startsWith('https://store.steampowered.com/news')) {
  //   const steamRequestID = new URLSearchParams(window.location.search).get(steamRequestIDKey);
  //   if (steamRequestID !== null) {
  //     handleSteamRequests();

  //     return;
  //   }

  //   startCreateFakeSteamHeader();
  // }

  const extendiumInfo = JSON.parse(await GetExtendiumInfo()) as ExtendiumInfo;

  linkClickInterceptor(extensions, extendiumInfo.externalLinks ?? []);
}
