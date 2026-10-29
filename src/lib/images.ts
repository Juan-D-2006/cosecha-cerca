// Fotos libres de Unsplash (https://unsplash.com/license), servidas desde su CDN.
const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

/** Imagen de portada para login y registro */
export const HERO_IMAGE = unsplash("photo-1591586116988-62fe65164f8d", 1400);

/** Imagen por categoría cuando una publicación antigua no tiene foto */
const CATEGORY_IMAGES: Record<string, string> = {
  verduras: unsplash("photo-1640958904159-51ae08bd3412"),
  frutas: unsplash("photo-1594282241894-4da286138f44"),
  tuberculos: unsplash("photo-1518977676601-b53f82aba655"),
  granos: unsplash("photo-1649251037566-6881b4956615"),
  hierbas: unsplash("photo-1629157247277-48f870757026"),
  huevos: unsplash("photo-1518569656558-1f25e69d93d7"),
};
const DEFAULT_IMAGE = unsplash("photo-1690934164598-99267828e900");

export const listingImage = (imageUrl: string | null, categorySlug: string | null) =>
  imageUrl || (categorySlug && CATEGORY_IMAGES[categorySlug]) || DEFAULT_IMAGE;
