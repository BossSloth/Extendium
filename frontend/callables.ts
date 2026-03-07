import { callable } from '@steambrew/client';

/** @returns json serialized {@link ExtendiumInfo} */
export const GetExtendiumInfo = callable<[], string>('GetExtendiumInfo');

export const UpdateExternalLinks = callable<[{ external_links: string; }], void>('UpdateExternalLinks');

export const InstallInternalExtension = callable<[], string>('InstallInternalExtension');
