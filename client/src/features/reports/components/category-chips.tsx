import { CATEGORIES } from "@/features/reports/data/mock-reports";

interface CategoryChipsProps {
  selected: string[];
  onToggle: (categoryId: string) => void;
}

export function CategoryChips({ selected, onToggle }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = selected.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
            }`}
          >
            <span aria-hidden="true">{cat.icon}</span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
