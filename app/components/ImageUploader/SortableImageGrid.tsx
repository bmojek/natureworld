"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { PreparedImage } from "./types";
import { SortableItem } from "./SortableItem";

export default function SortableImageGrid({
  images,
  onChange,
}: {
  images: PreparedImage[];
  onChange: (imgs: PreparedImage[]) => void;
}) {
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;

        const oldIndex = images.findIndex((i) => i.id === active.id);
        const newIndex = images.findIndex((i) => i.id === over.id);

        const reordered = arrayMove(images, oldIndex, newIndex).map(
          (img, idx) => ({
            ...img,
            isMain: idx === 0,
          }),
        );

        onChange(reordered);
      }}
    >
      <SortableContext items={images.map((i) => i.id)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <SortableItem
              key={img.id}
              img={img}
              onRemove={() => {
                const next = images
                  .filter((i) => i.id !== img.id)
                  .map((i, idx) => ({
                    ...i,
                    isMain: idx === 0,
                  }));

                onChange(next);
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
