import React, { JSX, useEffect, useRef, useState } from 'react';
import { Size } from './ExtensionBar/ExtensionButton';

interface ExtensionActionProps {
  onResizeCallback?(callback: (size: Size) => void): void;
  readonly children: React.ReactNode;
}

export function ExtensionAction({ children, onResizeCallback }: ExtensionActionProps): JSX.Element {
  // eslint-disable-next-line @eslint-react/naming-convention-ref-name
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 200, height: 600 });

  useEffect(() => {
    const popupWindow = container.current?.ownerDocument.defaultView;
    if (!popupWindow) return;

    // eslint-disable-next-line @typescript-eslint/no-shadow
    onResizeCallback?.((size: Size) => {
      setSize(size);
      popupWindow.SteamClient.Window.ResizeTo(size.width, size.height, false);
      if (container.current) {
        container.current.style.width = `${size.width}px`;
        container.current.style.height = `${size.height}px`;
      }

      Promise.all([
        popupWindow.SteamClient.Window.GetWindowRestoreDetails(),
        popupWindow.SteamClient.Window.GetWindowDimensions(),
      ]).then(([details, dimensions]) => {
        const screenWidth = popupWindow.screen.width;
        const screenHeight = popupWindow.screen.height;
        const edgePadding = 10;

        let newX = dimensions.x;
        let newY = dimensions.y;

        if (dimensions.x + size.width > screenWidth - edgePadding) {
          newX = screenWidth - size.width - edgePadding;
        }
        if (dimensions.y + size.height > screenHeight - edgePadding) {
          newY = screenHeight - size.height - edgePadding;
        }
        if (dimensions.x < edgePadding) {
          newX = edgePadding;
        }
        if (dimensions.y < edgePadding) {
          newY = edgePadding;
        }

        if (newX !== dimensions.x || newY !== dimensions.y) {
          popupWindow.SteamClient.Window.PositionWindowRelative(
            details,
            newX - dimensions.x,
            newY - dimensions.y,
            0,
            0,
          );
        }
      });
    });
  }, [onResizeCallback, size]);

  return (
    <div style={{ width: size.width, height: size.height }} ref={container}>
      {children}
    </div>
  );
}
