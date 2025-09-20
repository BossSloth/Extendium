import { callable } from "@steambrew/client";

/** @returns json serialized {@link ExtensionInfos} */
export const GetExtensionsInfos = callable<[], string>('GetExtensionsInfos');

export const UpdateExternalLinks = callable<[{external_links: string}], void>('UpdateExternalLinks');
