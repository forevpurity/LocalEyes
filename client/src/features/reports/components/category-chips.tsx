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
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {(categories ?? []).map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-primary bg-primary/10 font-semibold text-primary shadow-sm"
                : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
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
