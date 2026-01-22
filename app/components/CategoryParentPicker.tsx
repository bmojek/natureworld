"use client";

import { CategoryTree } from "@/app/lib/categories";
import { Trash2 } from "lucide-react";

type Props = {
  tree: CategoryTree[];
  selectedParentId: string | null;
  onSelect: (id: string | null) => void;
  onDelete?: (cat: CategoryTree) => void;
};

export default function CategoryParentPicker({
  tree,
  selectedParentId,
  onSelect,
  onDelete,
}: Props) {
  return (
    <div className="space-y-2 text-sm">
      {/* ROOT */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded ${
          selectedParentId === null
            ? "bg-primary text-white"
            : "hover:bg-gray-100"
        }`}
      >
        📁 Kategoria główna
      </button>

      {tree.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          selectedParentId={selectedParentId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function CategoryNode({
  category,
  selectedParentId,
  onSelect,
  onDelete,
}: {
  category: CategoryTree;
  selectedParentId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (cat: CategoryTree) => void;
}) {
  return (
    <div className="space-y-1">
      {/* ROW */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(category.id)}
          className={`flex-1 text-left px-3 py-2 rounded ${
            selectedParentId === category.id
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          {category.name}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="text-red-500 hover:text-red-700"
            title="Usuń kategorię"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* CHILDREN */}
      {category.children.length > 0 && (
        <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selectedParentId={selectedParentId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
