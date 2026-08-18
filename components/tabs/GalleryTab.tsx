"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Image as ImageIcon, Star, Grid3x3, Globe, Plus, Pencil, Check, X, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Select, FormField, Input } from "@/components/ui/Input";
import { useStore } from "@/lib/store";

const GRID_CATEGORIES = ["automotive", "medical", "foody", "clothes", "cosmetics"] as const;
type Section = "hero" | "grid";

type Website = {
  id: string;
  name: string;
  url: string;
  description: string;
  sortOrder: number;
};

type Image = {
  id: string;
  filename: string;
  url: string;
  section: Section;
  category: string;
  altText: string;
  caption: string;
  sortOrder: number;
};

export function GalleryTab() {
  const addToast = useStore((s) => s.addToast);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("grid");
  const [category, setCategory] = useState<string>("brand");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);

  async function reload() {
    setLoading(true);
    try {
      const [imgRes, siteRes] = await Promise.all([
        fetch("/api/gallery").then((r) => r.json()),
        fetch("/api/websites").then((r) => r.json()),
      ]);
      setImages(imgRes.images || []);
      setWebsites(siteRes.websites || []);
    } catch {
      addToast("Failed to load gallery", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("section", section);
      fd.append("category", category);
      fd.append("altText", altText);
      const res = await fetch("/api/gallery", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(data.error || "Upload failed", "error");
        return;
      }
      addToast("Image uploaded", "success");
      setAltText("");
      await reload();
    } catch {
      addToast("Network error", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(img: Image) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    const res = await fetch(`/api/gallery/${img.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Delete failed", "error");
      return;
    }
    addToast("Image removed", "info");
    await reload();
  }

  async function handleChangeCategory(img: Image, newCategory: string) {
    const res = await fetch(`/api/gallery/${img.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCategory }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Update failed", "error");
      return;
    }
    addToast("Category updated", "success");
    await reload();
  }

  async function handleChangeSection(img: Image, newSection: Section) {
    const res = await fetch(`/api/gallery/${img.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: newSection }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Update failed", "error");
      return;
    }
    addToast("Moved", "success");
    await reload();
  }

  async function handleAddWebsite(fields: { name: string; url: string; description: string }) {
    const res = await fetch("/api/websites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Could not add website", "error");
      return false;
    }
    addToast("Website added", "success");
    await reload();
    return true;
  }

  async function handleUpdateWebsite(id: string, fields: Partial<Website>) {
    const res = await fetch(`/api/websites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Update failed", "error");
      return false;
    }
    addToast("Website updated", "success");
    await reload();
    return true;
  }

  async function handleDeleteWebsite(site: Website) {
    if (!confirm(`Remove "${site.name}" from the website section?`)) return;
    const res = await fetch(`/api/websites/${site.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast(data.error || "Delete failed", "error");
      return;
    }
    addToast("Website removed", "info");
    await reload();
  }

  const heroImages = images.filter((i) => i.section === "hero");
  const gridImages = images.filter((i) => i.section === "grid");

  return (
    <div className="flex flex-col gap-4 md:h-full md:overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Gallery</p>
          <p className="text-sm text-white/60 mt-0.5">
            Images shown on the public /gallary page. Hero photos sit at the top, grid photos make up the filterable wall below.
          </p>
        </div>
      </div>

      {/* Upload form */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-[140px_140px_1fr_auto] gap-3 items-end">
          <FormField label="Section">
            <Select value={section} onChange={(e) => setSection(e.target.value as Section)}>
              <option value="hero">Hero (top 5)</option>
              <option value="grid">Grid (wall)</option>
            </Select>
          </FormField>
          <FormField label="Category">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={section === "hero"}
            >
              {GRID_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Alt text (for screen readers)">
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Optional"
              maxLength={200}
            />
          </FormField>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <Button
              variant="gold"
              icon={<Upload size={14} />}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-white/30 mt-3">
          JPG / PNG / WebP / GIF · max 8 MB
        </p>
      </GlassCard>

      <div className="flex-1 overflow-y-auto flex flex-col gap-5 pb-4">
        {loading && (
          <GlassCard className="p-10 text-center text-white/30 text-sm">Loading…</GlassCard>
        )}

        {!loading && (
          <>
            {/* HERO */}
            <section>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Star size={14} className="text-[#d4a017]" />
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                  Hero · {heroImages.length}/5
                </p>
                {heroImages.length > 5 && (
                  <span className="text-[10px] text-amber-400">
                    Only the first 5 appear at the top of /gallary
                  </span>
                )}
              </div>
              {heroImages.length === 0 ? (
                <GlassCard className="p-6 text-center text-white/30 text-sm">
                  No hero images yet
                </GlassCard>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {heroImages.map((img, i) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                    >
                      <GalleryCard
                        img={img}
                        onDelete={handleDelete}
                        onMove={(s) => handleChangeSection(img, s)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* GRID */}
            <section>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Grid3x3 size={14} className="text-white/60" />
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                  Grid · {gridImages.length}
                </p>
              </div>
              {gridImages.length === 0 ? (
                <GlassCard className="p-6 text-center text-white/30 text-sm">
                  No grid images yet
                </GlassCard>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gridImages.map((img, i) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.2 }}
                    >
                      <GalleryCard
                        img={img}
                        showCategory
                        onCategory={(c) => handleChangeCategory(img, c)}
                        onDelete={handleDelete}
                        onMove={(s) => handleChangeSection(img, s)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* WEBSITES */}
            <section>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Globe size={14} className="text-white/60" />
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">
                  Website Work · {websites.length}
                </p>
                <span className="text-[10px] text-white/25">
                  Shown below the posts on /gallary, with a live preview of each site
                </span>
              </div>

              <AddWebsiteForm onAdd={handleAddWebsite} />

              {websites.length === 0 ? (
                <GlassCard className="p-6 text-center text-white/30 text-sm mt-3">
                  No websites yet
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                  {websites.map((site, i) => (
                    <motion.div
                      key={site.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.2 }}
                    >
                      <WebsiteCard
                        site={site}
                        onSave={(fields) => handleUpdateWebsite(site.id, fields)}
                        onDelete={() => handleDeleteWebsite(site)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function GalleryCard({
  img,
  onDelete,
  onMove,
  onCategory,
  showCategory,
}: {
  img: Image;
  onDelete: (i: Image) => void;
  onMove: (s: Section) => void;
  onCategory?: (c: string) => void;
  showCategory?: boolean;
}) {
  return (
    <GlassCard className="overflow-hidden flex flex-col">
      <div className="aspect-[4/5] bg-black/30 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.altText || ""}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-2.5 flex flex-col gap-2">
        {showCategory && onCategory ? (
          <Select
            value={img.category}
            onChange={(e) => onCategory(e.target.value)}
            className="text-[11px] py-1.5"
          >
            {GRID_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-[11px] text-white/40 truncate" title={img.altText}>
            {img.altText || <ImageIcon size={11} className="inline" />}
          </p>
        )}
        <div className="flex gap-1">
          <button
            onClick={() => onMove(img.section === "hero" ? "grid" : "hero")}
            className="flex-1 text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
            title={img.section === "hero" ? "Move to grid" : "Move to hero"}
          >
            → {img.section === "hero" ? "grid" : "hero"}
          </button>
          <button
            onClick={() => onDelete(img)}
            aria-label="Delete image"
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function AddWebsiteForm({
  onAdd,
}: {
  onAdd: (fields: { name: string; url: string; description: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim() || saving) return;
    setSaving(true);
    const ok = await onAdd({ name: name.trim(), url: url.trim(), description: description.trim() });
    setSaving(false);
    if (ok) {
      setName("");
      setUrl("");
      setDescription("");
    }
  }

  return (
    <GlassCard className="p-4">
      <form
        onSubmit={submit}
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end"
      >
        <FormField label="Website name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Velocity Motors"
            maxLength={80}
            required
          />
        </FormField>
        <FormField label="URL">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="velocitymotors.com"
            maxLength={500}
            required
          />
        </FormField>
        <FormField label="Short description">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — e.g. Dealership site & configurator"
            maxLength={160}
          />
        </FormField>
        <Button type="submit" variant="gold" icon={<Plus size={14} />} disabled={saving}>
          {saving ? "Adding…" : "Add site"}
        </Button>
      </form>
      <p className="text-[11px] text-white/30 mt-3">
        The card shows a live embed of the site. Some sites block embedding — those fall back to a
        lettermark, and the card still links out.
      </p>
    </GlassCard>
  );
}

function WebsiteCard({
  site,
  onSave,
  onDelete,
}: {
  site: Website;
  onSave: (fields: { name: string; url: string; description: string }) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [description, setDescription] = useState(site.description);
  const [saving, setSaving] = useState(false);

  function cancel() {
    setName(site.name);
    setUrl(site.url);
    setDescription(site.description);
    setEditing(false);
  }

  async function save() {
    if (!name.trim() || !url.trim() || saving) return;
    setSaving(true);
    const ok = await onSave({
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
    });
    setSaving(false);
    if (ok) setEditing(false);
  }

  const host = (() => {
    try {
      return new URL(site.url).hostname.replace(/^www\./, "");
    } catch {
      return site.url;
    }
  })();

  return (
    <GlassCard className="overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-black/30 overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-3xl font-black text-[#d4a017]/50">
            {(site.name[0] || "?").toUpperCase()}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-white/25">{host}</span>
        </div>
        <iframe
          key={site.url}
          src={site.url}
          title={`Live preview of ${site.name}`}
          loading="lazy"
          tabIndex={-1}
          scrolling="no"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin"
          className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-25 border-0 bg-white pointer-events-none"
        />
        <span className="absolute inset-0 z-10" />
      </div>

      <div className="p-2.5 flex flex-col gap-2">
        {editing ? (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              maxLength={80}
              className="text-xs py-1.5"
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              maxLength={500}
              className="text-xs py-1.5"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              maxLength={160}
              className="text-xs py-1.5"
            />
            <div className="flex gap-1">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-[#d4a017]/20 hover:bg-[#d4a017]/30 text-[#d4a017] transition-colors disabled:opacity-40"
              >
                <Check size={11} aria-hidden="true" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancel}
                aria-label="Cancel edit"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate" title={site.name}>
                {site.name}
              </p>
              <p className="text-[11px] text-white/35 truncate" title={site.description || host}>
                {site.description || host}
              </p>
            </div>
            <div className="flex gap-1">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
              >
                <ExternalLink size={10} aria-hidden="true" />
                Open
              </a>
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit website"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              >
                <Pencil size={12} aria-hidden="true" />
              </button>
              <button
                onClick={onDelete}
                aria-label="Delete website"
                className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
