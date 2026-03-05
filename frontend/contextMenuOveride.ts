/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ContextMenu } from 'shared';

export function overrideContextMenuCancel(ContextMenuInstance: ContextMenu | undefined): void {
  // const ContextMenuInstanceClass = findModuleExport(exp =>
  //   typeof exp === 'function'
  //   && exp.prototype?.OnCancel?.toString?.()?.includes('onCancel') === true
  //   && exp.prototype?.OnCancel?.toString?.()?.includes('Hide') === true
  //   && exp.prototype?.Show !== undefined
  //   && exp.prototype?.BHasFocus !== undefined);

  if (ContextMenuInstance === undefined) {
    throw new Error('ContextMenuInstanceClass not found');
  }

  const ContextMenuInstanceClass = ContextMenuInstance.constructor;

  const originalOnCancel = ContextMenuInstanceClass.prototype.OnCancel as Function;

  if (originalOnCancel.toString().includes('originalOnCancel')) {
    // Function is already patched
    return;
  }

  // Override the OnCancel method to conditionally prevent blur close
  ContextMenuInstanceClass.prototype.OnCancel = function (delay = 0): any {
    if (this.options?.bDisableBlurClose === true) {
      return; // Don't call onCancel callback or Hide
    }

    // Support callback function to conditionally allow blur close
    if (typeof this.options?.shouldAllowBlurClose === 'function') {
      const shouldClose = this.options.shouldAllowBlurClose();
      if (shouldClose === false) {
        return; // Don't close if callback returns false
      }
    }

    // Call original method
    // eslint-disable-next-line @typescript-eslint/consistent-return, @typescript-eslint/no-unsafe-return
    return originalOnCancel.call(this, delay);
  };
}
