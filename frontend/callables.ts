import { callable } from '@steambrew/client';

/** @returns json serialized {@link ExtendiumInfo} */
export const GetExtendiumInfo = callable<[], string | undefined>('GetExtendiumInfo');

export const UpdateExternalLinks = callable<[{ external_links: string; }], void>('UpdateExternalLinks');

export const UpdateSettings = callable<[{ settings: string; }], void>('UpdateSettings');

export const InstallInternalExtension = callable<[], string>('InstallInternalExtension');

export const DeleteLegacyExtensions = callable<[], string>('DeleteLegacyExtensions');
