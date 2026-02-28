import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import React, { JSX, useMemo } from 'react';
import { useExtensionsStore } from 'stores/extensionsStore';
import { useSettingsStore } from '../../extensions-manager/Settings/settingsStore';
import { ToolbarManagerButton } from '../ToolbarExtensionManager/ToolbarManagerButton';
import { useExtensionsBarStore } from '../stores/extensionsBarStore';
import { ExtensionButton } from './ExtensionButton';

export function ExtensionsBar(): JSX.Element {
  const { extensions: allExtensions } = useExtensionsStore();
  const { extensionsOrder, setExtensionsOrder } = useExtensionsBarStore();
  const { barMarginLeft, barMarginRight } = useSettingsStore();

  const enabledExtensions = useMemo(() => {
    return new Map(Array.from(allExtensions.entries()).filter(([, extension]) => extension.enabled));
  }, [allExtensions]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setExtensionsOrder((items) => {
        const oldIndex = items.indexOf((active.id as string));
        const newIndex = items.indexOf((over?.id ?? '') as string);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function getBarStyles(): React.CSSProperties {
    const style: React.CSSProperties = {};

    if (barMarginLeft !== 0) {
      style.marginLeft = barMarginLeft;
    }

    if (barMarginRight !== 0) {
      style.marginRight = barMarginRight;
    }

    return style;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
    >
      <SortableContext items={extensionsOrder} strategy={horizontalListSortingStrategy}>
        <div className="extensions-bar" style={getBarStyles()}>
          {extensionsOrder.map((extensionId) => {
            const extension = enabledExtensions.get(extensionId);
            if (extension === undefined) {
              return null;
            }

            return <ExtensionButton key={extensionId} extension={extension} />;
          })}
          <ToolbarManagerButton />
        </div>
      </SortableContext>
    </DndContext>
  );
}
