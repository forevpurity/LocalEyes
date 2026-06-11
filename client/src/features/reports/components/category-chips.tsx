import type { Category } from "@/types/api";
import { getCategoryIcon } from "@/features/reports/lib/category-icons";

interface CategoryChipsProps {
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
  categories?: Category[];
}

export function CategoryChips({
  selected,
  onSelect,
  categories,
}: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(categories ?? []).map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
            }`}
          >
            <span aria-hidden="true">{getCategoryIcon(cat)}</span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
