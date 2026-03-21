import { constSysfsExpr } from '@steambrew/client';
import { contextMenuClasses } from 'classes';
import React from 'react';

export const extendiumStyles = fixInternalStyles(constSysfsExpr('extendium.css', { basePath: '../../public' }).content);

export function Styles(): React.JSX.Element {
  return <style>{extendiumStyles}</style>;
}

function fixInternalStyles(styleStr: string): string {
  for (const [key, value] of Object.entries(contextMenuClasses)) {
    styleStr = styleStr.replaceAll(new RegExp(`\\.__${key}\\b`, 'g'), `.${value}`);
  }

  return styleStr;
}
