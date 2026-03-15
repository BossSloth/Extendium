import { ExtendiumInfo } from '@extension/Metadata';
import { callable } from '@steambrew/webkit';
import { linkClickInterceptor } from './linkModifier';

/** @returns json serialized {@link ExtendiumInfo} */
export const GetExtendiumInfo = callable<[], string>('GetExtendiumInfo');

export default async function WebkitMain(): Promise<void> {
  const extendiumInfo = JSON.parse(await GetExtendiumInfo()) as ExtendiumInfo;

  linkClickInterceptor(extendiumInfo.externalLinks ?? []);
}
