"use client";

import { CategoryTree } from "@/app/lib/categories";

type Props = {
  tree: CategoryTree[];
  selected: string[];
  onToggle: (id: string) => void;
};

export default function CategoryTreePicker({
  tree,
  selected,
  onToggle,
}: Props) {
  return (
    <div className="space-y-2">
      {tree.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          selected={selected}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

/* ================= NODE ================= */

function CategoryNode({
  category,
  selected,
  onToggle,
}: {
  category: CategoryTree;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const hasChildren = category.children.length > 0;

  return (
    <div className="ml-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={selected.includes(category.id)}
          onChange={() => onToggle(category.id)}
        />

        <span className="font-medium">{category.name}</span>
      </label>

      {hasChildren && (
        <div className="ml-4 mt-1 border-l pl-3 space-y-1">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
