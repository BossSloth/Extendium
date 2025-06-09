import { constSysfsExpr } from '@steambrew/client';
import React from 'react';

const extendiumStyles = constSysfsExpr('extendium.css', { basePath: '../../public' }).content;

export function Styles(): React.JSX.Element {
  return <style>{extendiumStyles}</style>;
}
