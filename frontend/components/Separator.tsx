import { findModule } from '@steambrew/client';
import React, { JSX } from 'react';

export function Separator(): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-member-access
  const menuClasses = findModule(e => e.MenuItem && e.Separator) as Record<string, string>;

  return (
    <hr className={`${menuClasses.Separator} ${menuClasses.MenuItem}`} />
  );
}
