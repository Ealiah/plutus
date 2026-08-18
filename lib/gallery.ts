import path from "node:path";
import fs from "node:fs";

export const GALLERY_SECTIONS = ["hero", "grid"] as const;
export type GallerySection = (typeof GALLERY_SECTIONS)[number];

export const GRID_CATEGORIES = ["automotive", "medical", "foody", "clothes", "cosmetics"] as const;
export type GridCategory = (typeof GRID_CATEGORIES)[number];

export type GalleryImage = {
  id: string;
  filename: string;
  url: string;
  section: GallerySection;
  category: string;
  altText: string;
  caption: string;
  sortOrder: number;
  createdAt: number;
};

export function getUploadsDir(): string {
  const raw = process.env.UPLOADS_DIR || "./uploads";
  const abs = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

export function fileUrl(filename: string): string {
  return `/api/gallery/files/${encodeURIComponent(filename)}`;
}
