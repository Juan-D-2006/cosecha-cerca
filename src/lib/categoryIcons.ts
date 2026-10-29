import { Apple, Carrot, Egg, LayoutGrid, Leaf, Milk, Package, Sprout, Wheat, type LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  verduras: Carrot,
  frutas: Apple,
  tuberculos: Sprout,
  granos: Wheat,
  hierbas: Leaf,
  lacteos: Milk,
  huevos: Egg,
  otros: Package,
};

export const categoryIcon = (slug: string | null): LucideIcon => (slug && CATEGORY_ICONS[slug]) || LayoutGrid;
