/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { ClassModule, findClassModule } from '@steambrew/client';

export const DialogControlSectionClass = (findClassModule(m => m.ActionSection && m.LibrarySettings) as ClassModule).ActionSection;
export const settingsClasses = findClassModule(m => m.SettingsTitleBar && m.SettingsDialogButton) as ClassModule;
