import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { PreparedImage } from "./types";
import { X, GripVertical } from "lucide-react";

export function SortableItem({
  img,
  onRemove,
}: {
  img: PreparedImage;
  onRemove: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id: img.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="relative rounded-xl bg-white"
    >
      {/* MAIN badge */}

      {/* REMOVE */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white p-1 rounded-full"
      >
        <X size={14} />
      </button>

      {/* DRAG HANDLE */}
      <div
        {...listeners}
        {...attributes}
        className="absolute bottom-2 right-2 z-20 cursor-grab active:cursor-grabbing bg-white/90 p-1 rounded"
        title="Przeciągnij"
      >
        <GripVertical size={14} />
      </div>

      <Image
        src={img.previewUrl}
        alt=""
        width={300}
        height={300}
        className="aspect-square object-contain bg-white rounded-xl"
      />
    </div>
  );
}
