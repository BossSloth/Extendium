import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import React, { JSX, useEffect } from 'react';
import { Extension } from '../extension/Extension';
import { ExtensionButton } from './ExtensionButton';
import { useExtensionsOrderStore } from './extensionsOrderStore';

export function ExtensionsBar({ extensions }: { readonly extensions: Map<string, Extension>; }): JSX.Element {
  const { extensionsOrder, setExtensionsOrder } = useExtensionsOrderStore();

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

  useEffect(() => {
    if (extensionsOrder.length === 0) {
      setExtensionsOrder([...extensions.keys()]);
    }
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
    >
      <SortableContext items={extensionsOrder} strategy={horizontalListSortingStrategy}>
        <div className="extensions-bar">
          {extensionsOrder.map(extensionId => (
            extensions.get(extensionId)?.action.getIconUrl() === undefined
              ? null
              : (
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  <ExtensionButton key={extensionId} extension={extensions.get(extensionId)!} />
                )
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
