import { getDb } from "@/lib/db";
import { fileUrl } from "@/lib/gallery";
import { websiteHost, type Website } from "@/lib/websites";

const GRID_CATEGORIES = ["automotive", "medical", "foody", "clothes", "cosmetics"] as const;

type Row = {
  filename: string;
  section: string;
  category: string;
  alt_text: string;
  sort_order: number;
};

// Fixed hero stage positions (mirror the original work.html layout)
const HERO_POSITIONS = [
  { x: -320, y: 15, r: -2, z: 10 },
  { x: -160, y: 32, r: 1.5, z: 20 },
  { x: 0, y: 8, r: -1, z: 50 },
  { x: 160, y: 22, r: 2, z: 40 },
  { x: 320, y: 44, r: -1.5, z: 30 },
];

const PLACEHOLDER_HERO = [
  "https://picsum.photos/seed/plutus-work-1/600/600",
  "https://picsum.photos/seed/plutus-work-2/600/600",
  "https://picsum.photos/seed/plutus-work-3/600/600",
  "https://picsum.photos/seed/plutus-work-4/600/600",
  "https://picsum.photos/seed/plutus-work-5/600/600",
];
const PLACEHOLDER_GRID: Array<{ url: string; category: string }> = [
  { url: "https://picsum.photos/seed/velocity-launch/700/900", category: "automotive" },
  { url: "https://picsum.photos/seed/nexus-identity/700/900", category: "medical" },
  { url: "https://picsum.photos/seed/skyline-film/700/900", category: "foody" },
  { url: "https://picsum.photos/seed/cinder-stories/700/900", category: "clothes" },
  { url: "https://picsum.photos/seed/pulse-q3/700/900", category: "cosmetics" },
  { url: "https://picsum.photos/seed/lumen-refresh/700/900", category: "automotive" },
  { url: "https://picsum.photos/seed/field-paid/700/900", category: "medical" },
  { url: "https://picsum.photos/seed/vertex-series/700/900", category: "foody" },
  { url: "https://picsum.photos/seed/orbit-activation/700/900", category: "clothes" },
  { url: "https://picsum.photos/seed/atlas-system/700/900", category: "cosmetics" },
  { url: "https://picsum.photos/seed/stream-optimize/700/900", category: "automotive" },
  { url: "https://picsum.photos/seed/sketch-notes/700/900", category: "foody" },
];

const PLACEHOLDER_WEBSITES: Array<{ name: string; url: string; description: string }> = [
  { name: "Velocity Motors", url: "https://vercel.com", description: "Dealership site & configurator" },
  { name: "Nexus Health", url: "https://linear.app", description: "Clinic booking platform" },
  { name: "Foody Market", url: "https://stripe.com", description: "Storefront & online ordering" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderWebsiteCards(sites: Array<{ name: string; url: string; description: string }>): string {
  return sites
    .map((site) => {
      const host = websiteHost(site.url);
      return `
    <a class="site-card" href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer">
      <div class="site-frame">
        <div class="site-chrome" aria-hidden="true">
          <span class="site-dot"></span><span class="site-dot"></span><span class="site-dot"></span>
          <span class="site-chrome-url">${escapeHtml(host)}</span>
        </div>
        <div class="site-viewport">
          <div class="site-fallback" aria-hidden="true">
            <span class="site-fallback-mark">${escapeHtml((site.name[0] || "?").toUpperCase())}</span>
            <span class="site-fallback-label">${escapeHtml(host)}</span>
          </div>
          <iframe
            class="site-preview"
            src="${escapeHtml(site.url)}"
            title="Live preview of ${escapeHtml(site.name)}"
            loading="lazy"
            tabindex="-1"
            scrolling="no"
            referrerpolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"></iframe>
          <span class="site-shield" aria-hidden="true"></span>
        </div>
      </div>
      <div class="site-body">
        <div>
          <h3 class="site-name">${escapeHtml(site.name)}</h3>
          ${site.description ? `<p class="site-desc">${escapeHtml(site.description)}</p>` : `<p class="site-desc">${escapeHtml(host)}</p>`}
        </div>
        <span class="site-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></span>
      </div>
    </a>`;
    })
    .join("");
}


function renderHeroPhotos(heroes: Array<{ url: string; alt: string }>): string {
  return HERO_POSITIONS.map((pos, i) => {
    const photo = heroes[i];
    if (!photo) return "";
    return `
    <div class="gallery-photo" style="--x:${pos.x}px; --y:${pos.y}px; --r:${pos.r}deg; z-index:${pos.z}">
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt)}">
    </div>`;
  }).join("");
}

function renderGridCards(cards: Array<{ url: string; alt: string; category: string }>): string {
  return cards
    .map((c) => {
      const cat = (c.category || "brand").toLowerCase();
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      return `
    <article class="work-card" data-cat="${escapeHtml(cat)}">
      <img src="${escapeHtml(c.url)}" alt="${escapeHtml(c.alt)}">
      <div class="work-card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></div>
      <div class="work-card-body">
        <span class="work-card-cat">${escapeHtml(label)}</span>
      </div>
    </article>`;
    })
    .join("");
}

function renderFilterPills(): string {
  return [
    `<button class="filter-pill active" data-filter="all">All</button>`,
    ...GRID_CATEGORIES.map(
      (c) =>
        `<button class="filter-pill" data-filter="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`
    ),
  ].join("");
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT filename, section, category, alt_text, sort_order FROM gallery_images ORDER BY section, sort_order, created_at"
    )
    .all() as Row[];

  const heroRows = rows.filter((r) => r.section === "hero").slice(0, 5);
  const gridRows = rows.filter((r) => r.section === "grid");

  const heroes =
    heroRows.length > 0
      ? heroRows.map((r) => ({ url: fileUrl(r.filename), alt: r.alt_text || "" }))
      : PLACEHOLDER_HERO.map((url) => ({ url, alt: "" }));

  const siteRows = db
    .prepare(
      "SELECT id, name, url, description, sort_order, created_at FROM gallery_websites ORDER BY sort_order, created_at"
    )
    .all() as Array<Pick<Website, "name" | "url" | "description">>;

  const websites =
    siteRows.length > 0
      ? siteRows.map((r) => ({
          name: r.name,
          url: r.url,
          description: r.description || "",
        }))
      : PLACEHOLDER_WEBSITES;

  const grid =
    gridRows.length > 0
      ? gridRows.map((r) => ({
          url: fileUrl(r.filename),
          alt: r.alt_text || "",
          category: r.category || "brand",
        }))
      : PLACEHOLDER_GRID.map((p) => ({ url: p.url, alt: "", category: p.category }));

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Our Work · PLUTUS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..900;1,14..32,300..900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0c0a07; --text: #f0ece3; --muted: rgba(240,236,227,0.48);
      --gold: #d4a017; --gold-dim: rgba(212,160,23,0.12); --gold-glow: rgba(212,160,23,0.22);
      --nav-bg: rgba(12,10,7,0.72); --card: #16130c;
      --border: rgba(240,236,227,0.07); --dot: rgba(212,160,23,0.22);
    }
    [data-theme="light"] {
      --bg: #f3ede1; --text: #1a1714; --muted: rgba(26,23,20,0.5);
      --gold: #a8780f; --gold-dim: rgba(168,120,15,0.12); --gold-glow: rgba(168,120,15,0.2);
      --nav-bg: rgba(243,237,225,0.80); --card: #e6e0d4;
      --border: rgba(26,23,20,0.09); --dot: rgba(168,120,15,0.28);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg); color: var(--text);
      min-height: 100vh; overflow-x: hidden;
      transition: background 0.4s ease, color 0.4s ease;
    }
    body::before {
      content: ''; position: fixed; inset: 0;
      background-image: radial-gradient(var(--dot) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(ellipse at center, transparent 30%, var(--bg) 100%);
      -webkit-mask-image: radial-gradient(ellipse at center, transparent 30%, var(--bg) 100%);
      pointer-events: none; z-index: 0;
    }
    #curtain { position: fixed; inset: 0; transform-origin: top; transform: scaleY(0); z-index: 9999; pointer-events: none; }
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
      height: 68px; padding: 0 2.5rem;
      background: var(--nav-bg);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-bottom: 1px solid var(--border);
      transition: background 0.4s ease, border-color 0.4s ease;
    }
    .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; justify-self: start; }
    .nav-logo img { height: 28px; width: auto; }
    .nav-logo-text { font-size: 0.875rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text); transition: color 0.4s; }
    .nav-links { display: flex; align-items: center; gap: 2.75rem; list-style: none; }
    .nav-link { text-decoration: none; overflow: hidden; height: 1.15em; display: block; }
    .nav-link-inner { display: flex; flex-direction: column; transition: transform 0.32s cubic-bezier(0.34,1.2,0.64,1); }
    .nav-link-inner span { display: block; font-size: 0.875rem; font-weight: 500; letter-spacing: 0.01em; color: var(--muted); line-height: 1.15; transition: color 0.25s; }
    .nav-link-inner span:last-child { color: var(--text); }
    .nav-link:hover .nav-link-inner { transform: translateY(-1.15em); }
    .nav-link-gold .nav-link-inner span, .nav-link-gold .nav-link-inner span:last-child { color: var(--gold); }
    .nav-link-gold:hover .nav-link-inner span:last-child { color: var(--gold); filter: brightness(1.15); }
    .nav-link-active .nav-link-inner span, .nav-link-active .nav-link-inner span:last-child { color: var(--text); }
    .nav-link-active .nav-link-inner span:first-child { position: relative; }
    .nav-link-active .nav-link-inner span:first-child::after { content: ''; position: absolute; bottom: -3px; left: 0; right: 0; height: 1px; background: var(--gold); }
    .nav-right { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; }
    #themeToggle { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: var(--card); color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.35s, color 0.35s, border-color 0.35s, transform 0.15s; outline: none; }
    #themeToggle:hover { transform: scale(1.12); }
    #themeToggle:active { transform: scale(0.92); }
    #themeToggle svg { width: 15px; height: 15px; display: block; pointer-events: none; }
    .work-hero { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8rem 1.5rem 4rem; }
    .work-hero-glow { position: absolute; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, var(--gold-glow) 0%, transparent 65%); top: 40%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
    .work-eyebrow { position: relative; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.28em; color: var(--gold); text-transform: uppercase; margin-bottom: 1.5rem; }
    .work-headline { position: relative; font-size: clamp(3.5rem, 9vw, 7.5rem); font-weight: 900; line-height: 0.9; letter-spacing: -0.04em; margin-bottom: 1.5rem; }
    .work-headline .gold-accent { color: transparent; -webkit-text-stroke: 1.5px var(--gold); font-style: italic; }
    .work-sub { position: relative; max-width: 50ch; font-size: 1rem; line-height: 1.7; color: var(--muted); margin-bottom: 3.5rem; }
    .gallery-stage { position: relative; width: 100%; height: 280px; display: flex; align-items: center; justify-content: center; margin-bottom: 3rem; }
    .gallery-photo { position: absolute; width: 200px; height: 200px; border-radius: 20px; overflow: hidden; background: var(--card); border: 1px solid var(--border); box-shadow: 0 18px 50px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.2); transform: translate(0, 0) rotate(0); transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), z-index 0s 0.4s; will-change: transform; }
    .gallery-photo img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; filter: saturate(0.9) brightness(0.95); transition: filter 0.3s; }
    .gallery-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(11,11,12,0.4) 100%); pointer-events: none; transition: opacity 0.3s; }
    [data-theme="light"] .gallery-photo::after { background: linear-gradient(180deg, transparent 50%, rgba(26,26,26,0.2) 100%); }
    .gallery-photo:hover { z-index: 99 !important; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s; }
    .gallery-photo:hover img { filter: saturate(1.1) brightness(1); }
    .gallery-photo.loaded { transform: translate(var(--x), var(--y)) rotate(var(--r)); }
    .gallery-photo.loaded:hover { transform: translate(var(--x), var(--y)) rotate(0) scale(1.1); }
    .work-cta { display: inline-flex; align-items: center; gap: 0.625rem; padding: 0.875rem 2rem; background: var(--gold); color: #0c0a07; border: none; border-radius: 12px; font-family: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s; box-shadow: 0 4px 24px var(--gold-dim); }
    .work-cta:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 8px 32px var(--gold-glow); }
    .work-cta:active { transform: translateY(0); opacity: 1; }
    [data-theme="light"] .work-cta { color: #fff; }
    .work-section { position: relative; z-index: 1; padding: 6rem 1.5rem; max-width: 1280px; margin: 0 auto; }
    .work-section-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; flex-wrap: wrap; margin-bottom: 3rem; }
    .work-section-title { font-size: clamp(2.5rem, 4.5vw, 3.5rem); font-weight: 800; letter-spacing: -0.025em; color: var(--text); line-height: 1.05; }
    .work-section-sub { font-size: 0.9rem; color: var(--muted); margin-top: 0.5rem; max-width: 36ch; }
    .filter-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; background: var(--card); border: 1px solid var(--border); border-radius: 100px; padding: 0.35rem; }
    .filter-pill { padding: 0.55rem 1.15rem; font-family: inherit; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.02em; color: var(--muted); background: none; border: none; cursor: pointer; border-radius: 100px; transition: background 0.25s, color 0.25s; }
    .filter-pill:hover { color: var(--text); }
    .filter-pill.active { background: var(--gold); color: #0c0a07; }
    [data-theme="light"] .filter-pill.active { color: #fff; }
    .work-grid { display: grid; grid-template-columns: repeat(auto-fill, 280px); justify-content: center; gap: 1.25rem; }
    .work-card { position: relative; aspect-ratio: 4 / 5; border-radius: 16px; overflow: hidden; background: var(--card); border: 1px solid var(--border); cursor: pointer; transition: opacity 0.4s ease, transform 0.4s ease, border-color 0.25s; }
    .work-card:hover { border-color: var(--gold); }
    .work-card.hide { opacity: 0; transform: scale(0.92); pointer-events: none; position: absolute; visibility: hidden; }
    .work-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(0.85) brightness(0.85); transition: filter 0.5s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    .work-card:hover img { filter: saturate(1) brightness(1); transform: scale(1.05); }
    .work-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 35%, rgba(11,11,12,0.92) 100%); pointer-events: none; z-index: 1; }
    [data-theme="light"] .work-card::before { background: linear-gradient(180deg, transparent 35%, rgba(26,26,26,0.85) 100%); }
    .work-card-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem 1.25rem 1.25rem; z-index: 2; }
    .work-card-cat { display: inline-block; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); transition: opacity 0.2s; }
    /* When a category filter is active, the surviving cards all share that category. The label becomes redundant. */
    body.filter-active .work-card-cat { display: none; }
    .work-card-arrow { position: absolute; top: 1.25rem; right: 1.25rem; width: 36px; height: 36px; border-radius: 50%; background: rgba(11,11,12,0.45); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #f0ece3; opacity: 0; transform: translateY(-8px); transition: opacity 0.25s, transform 0.25s; z-index: 2; }
    .work-card:hover .work-card-arrow { opacity: 1; transform: translateY(0); }
    .work-card-arrow svg { width: 14px; height: 14px; }
    .site-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .site-card { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit; transition: border-color 0.25s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s; }
    .site-card:hover { border-color: var(--gold); transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
    .site-frame { position: relative; }
    .site-chrome { display: flex; align-items: center; gap: 0.35rem; padding: 0.6rem 0.85rem; border-bottom: 1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent); }
    .site-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); }
    .site-chrome-url { margin-left: 0.5rem; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.06em; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .site-viewport { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: var(--card); }
    .site-fallback { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; background: radial-gradient(circle at 50% 40%, var(--gold-dim), transparent 70%); }
    .site-fallback-mark { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.04em; color: var(--gold); opacity: 0.55; }
    .site-fallback-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
    .site-preview { position: absolute; top: 0; left: 0; width: 400%; height: 400%; border: 0; transform: scale(0.25); transform-origin: top left; pointer-events: none; background: #fff; filter: saturate(0.92) brightness(0.94); transition: filter 0.4s; }
    .site-card:hover .site-preview { filter: saturate(1) brightness(1); }
    .site-shield { position: absolute; inset: 0; z-index: 2; }
    .site-body { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.25rem 1.25rem; }
    .site-name { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.015em; color: var(--text); }
    .site-desc { margin-top: 0.3rem; font-size: 0.8rem; line-height: 1.5; color: var(--muted); }
    .site-arrow { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); transition: color 0.25s, border-color 0.25s, transform 0.25s; }
    .site-card:hover .site-arrow { color: var(--gold); border-color: var(--gold); transform: translate(2px, -2px); }
    .site-arrow svg { width: 14px; height: 14px; }
    .footer-reveal { position: relative; height: 100vh; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
    footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 100vh; background: var(--bg); color: var(--text); display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; transition: background 0.4s ease, color 0.4s ease; }
    .footer-grid-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; background-size: 60px 60px; background-image: linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px); mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.8) 70%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.8) 70%, transparent); }
    .footer-aurora { position: absolute; left: 50%; top: 50%; width: 80vw; height: 60vh; border-radius: 50%; background: radial-gradient(circle, var(--gold-glow) 0%, transparent 70%); transform: translate(-50%, -50%); animation: footer-breathe 8s ease-in-out infinite alternate; filter: blur(60px); pointer-events: none; z-index: 0; }
    @keyframes footer-breathe { 0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.12); } }
    .footer-giant-text { position: absolute; bottom: -6vh; left: 50%; transform: translateX(-50%); font-size: 26vw; line-height: 0.75; font-weight: 900; letter-spacing: -0.05em; white-space: nowrap; color: transparent; -webkit-text-stroke: 1px var(--border); background: linear-gradient(180deg, var(--muted) 0%, transparent 60%); -webkit-background-clip: text; background-clip: text; pointer-events: none; z-index: 0; user-select: none; }
    .footer-center { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 0 2rem; }
    .footer-heading { font-size: clamp(3rem, 8vw, 7rem); font-weight: 900; letter-spacing: -0.04em; text-align: center; margin-bottom: 3rem; background: linear-gradient(180deg, var(--text) 0%, rgba(240,236,227,0.35) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 0 30px var(--gold-dim)); }
    [data-theme="light"] .footer-heading { background: linear-gradient(180deg, var(--text) 0%, rgba(26,23,20,0.3) 100%); -webkit-background-clip: text; background-clip: text; }
    .footer-pills { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; }
    .footer-pill-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.875rem; }
    .glass-pill { display: inline-flex; align-items: center; gap: 0.625rem; padding: 0.9rem 2rem; background: var(--card); border: 1px solid var(--border); border-radius: 100px; font-size: 0.9rem; font-weight: 600; color: var(--text); text-decoration: none; cursor: pointer; font-family: inherit; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); transition: background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.15s; }
    .glass-pill:hover { background: var(--gold-dim); border-color: var(--gold); box-shadow: 0 8px 32px var(--gold-dim); transform: translateY(-2px); }
    .glass-pill-sm { padding: 0.6rem 1.25rem; font-size: 0.78rem; color: var(--muted); }
    .glass-pill-sm:hover { color: var(--text); }
    .footer-bar { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2.5rem; border-top: 1px solid var(--border); }
    .footer-copy, .footer-love { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
    .footer-love { display: flex; align-items: center; gap: 0.4rem; }
    .heart { display: inline-flex; align-items: center; width: 14px; height: 14px; color: #e64d4d; animation: heartbeat 2s ease-in-out infinite; }
    .heart svg { width: 100%; height: 100%; display: block; }
    @keyframes heartbeat { 0%, 100% { transform: scale(1); } 15%, 45% { transform: scale(1.3); } 30% { transform: scale(1); } }
    #backToTop { width: 40px; height: 40px; border-radius: 50%; background: var(--card); border: 1px solid var(--border); color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: background 0.25s, border-color 0.25s, color 0.25s, transform 0.15s; }
    #backToTop:hover { color: var(--text); transform: translateY(-2px); }
    #backToTop svg { width: 16px; height: 16px; }
    @keyframes fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { opacity: 0; animation: fade-up 0.7s ease-out forwards; }
    .fade-in-1 { animation-delay: 0.1s; }
    .fade-in-2 { animation-delay: 0.25s; }
    .fade-in-3 { animation-delay: 0.4s; }
    :focus { outline: none; }
    :focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; border-radius: 6px; }
    .nav-link:focus-visible, .work-cta:focus-visible, .glass-pill:focus-visible, .filter-pill:focus-visible { outline-offset: 5px; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
      .gallery-photo.loaded { transition: none !important; }
      .footer-aurora, .heart { animation: none !important; }
    }
    @media (max-width: 900px) {
      .work-grid { grid-template-columns: repeat(auto-fill, 220px); gap: 1rem; }
    }
    @media (max-width: 700px) {
      nav { padding: 0 1.25rem; grid-template-columns: 1fr auto; height: 60px; }
      .nav-links { display: none; }
      .work-hero { padding: 6rem 1.25rem 3rem; min-height: 90vh; }
      .work-headline { font-size: clamp(2.75rem, 12vw, 4.5rem); margin-bottom: 1.25rem; }
      .work-sub { font-size: 0.9rem; margin-bottom: 2.5rem; }
      .gallery-stage { height: 220px; margin-bottom: 2rem; }
      .gallery-photo { width: 130px; height: 130px; border-radius: 16px; }
      /* Override the inline --x offsets to fit narrow viewports */
      .gallery-photo:nth-child(1) { --x: -150px !important; --y: 10px !important; }
      .gallery-photo:nth-child(2) { --x: -75px !important; --y: 22px !important; }
      .gallery-photo:nth-child(3) { --x: 0 !important; --y: 4px !important; }
      .gallery-photo:nth-child(4) { --x: 75px !important; --y: 18px !important; }
      .gallery-photo:nth-child(5) { --x: 150px !important; --y: 30px !important; }
      .work-section { padding: 4rem 1.25rem; }
      .work-section-header { flex-direction: column; align-items: flex-start; margin-bottom: 2rem; }
      .work-grid { grid-template-columns: repeat(auto-fill, 160px); gap: 0.75rem; }
      .site-grid { grid-template-columns: 1fr; gap: 1rem; }
      .footer-heading { font-size: clamp(2.5rem, 14vw, 5rem); margin-bottom: 2rem; }
      .footer-bar { flex-direction: column; gap: 1rem; padding: 1.5rem; }
      .filter-bar { width: 100%; overflow-x: auto; flex-wrap: nowrap; }
      .filter-pill { flex-shrink: 0; }
    }
    @media (max-width: 480px) {
      .work-headline { font-size: clamp(2.5rem, 13vw, 3.75rem); }
      .gallery-stage { height: 180px; }
      .gallery-photo { width: 96px; height: 96px; border-radius: 14px; }
      /* Hide the outermost two photos so the remaining three breathe */
      .gallery-photo:nth-child(1),
      .gallery-photo:nth-child(5) { display: none; }
      .gallery-photo:nth-child(2) { --x: -64px !important; --y: 14px !important; }
      .gallery-photo:nth-child(3) { --x: 0 !important; --y: 0 !important; }
      .gallery-photo:nth-child(4) { --x: 64px !important; --y: 14px !important; }
      .work-section { padding: 3rem 1rem; }
      .work-grid { grid-template-columns: repeat(auto-fill, 145px); gap: 0.625rem; }
      .work-cta { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
<div id="curtain"></div>
<nav>
  <a href="/" class="nav-logo">
    <img src="/logo.png" alt="PLUTUS" onerror="this.style.display='none'">
    <span class="nav-logo-text">PLUTUS</span>
  </a>
  <ul class="nav-links">
    <li><a href="/gallary" class="nav-link nav-link-active"><span class="nav-link-inner"><span>Our Work</span><span>Our Work</span></span></a></li>
    <li><a href="/#about" class="nav-link"><span class="nav-link-inner"><span>About</span><span>About</span></span></a></li>
    <li><a href="https://www.instagram.com/plutus.iq" target="_blank" rel="noopener" class="nav-link nav-link-gold"><span class="nav-link-inner"><span>Follow Us</span><span>Follow Us</span></span></a></li>
  </ul>
  <div class="nav-right">
    <button id="themeToggle" aria-label="Toggle theme"></button>
  </div>
</nav>

<section class="work-hero">
  <div class="work-hero-glow" aria-hidden="true"></div>
  <p class="work-eyebrow fade-in fade-in-1">A Reel Through Our Year</p>
  <h1 class="work-headline fade-in fade-in-2">Selected work, <span class="gold-accent">in motion.</span></h1>
  <p class="work-sub fade-in fade-in-3">Campaigns, brand systems, and films we shipped this year. A curated reel of the work we'd defend in a room.</p>
  <div class="gallery-stage" id="galleryStage" aria-hidden="true">
    ${renderHeroPhotos(heroes)}
  </div>
  <a href="#all-work" class="work-cta">
    View All Projects
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
  </a>
</section>

<section class="work-section" id="all-work">
  <div class="work-section-header">
    <div>
      <h2 class="work-section-title">Selected Work</h2>
      <p class="work-section-sub">Filter by discipline, or browse it all.</p>
    </div>
    <div class="filter-bar" role="tablist">${renderFilterPills()}</div>
  </div>
  <div class="work-grid" id="workGrid">${renderGridCards(grid)}</div>
</section>

<section class="work-section" id="websites">
  <div class="work-section-header">
    <div>
      <h2 class="work-section-title">Websites We Build</h2>
      <p class="work-section-sub">Live sites, previewed right here. Click any card to open the real thing.</p>
    </div>
  </div>
  <div class="site-grid" id="siteGrid">${renderWebsiteCards(websites)}</div>
</section>

<div class="footer-reveal">
  <footer>
    <div class="footer-grid-bg"></div>
    <div class="footer-aurora"></div>
    <div class="footer-giant-text" aria-hidden="true">PLUTUS</div>
    <div class="footer-center">
      <h2 class="footer-heading">Let's make<br>something.</h2>
      <div class="footer-pills">
        <div class="footer-pill-row">
          <a href="#" class="glass-pill">Start a Project</a>
          <a href="/#about" class="glass-pill">View Capabilities</a>
        </div>
        <div class="footer-pill-row">
          <a href="/" class="glass-pill glass-pill-sm">Home</a>
          <a href="#" class="glass-pill glass-pill-sm">Studio</a>
          <a href="https://www.instagram.com/plutus.iq" target="_blank" rel="noopener" class="glass-pill glass-pill-sm">Instagram</a>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span class="footer-copy">© 2026 PLUTUS Studio. All rights reserved.</span>
      <div class="footer-love">
        Crafted with
        <span class="heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </span>
        by PLUTUS
      </div>
      <button id="backToTop" aria-label="Back to top">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      </button>
    </div>
  </footer>
</div>

<script>
(function () {
  'use strict';
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = 550;
  var EASING = 'cubic-bezier(0.76, 0, 0.24, 1)';
  var html = document.documentElement;
  var curtain = document.getElementById('curtain');
  var btn = document.getElementById('themeToggle');
  var animating = false;
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  function isDark() { return html.getAttribute('data-theme') === 'dark'; }
  function updateIcon() { btn.innerHTML = isDark() ? MOON : SUN; }
  btn.addEventListener('click', function () {
    if (animating) return;
    animating = true;
    var next = isDark() ? 'light' : 'dark';
    var nextBg = next === 'dark' ? '#0c0a07' : '#f3ede1';
    curtain.style.background = nextBg;
    curtain.style.transformOrigin = 'top';
    curtain.style.transition = 'transform ' + DURATION + 'ms ' + EASING;
    curtain.style.transform = 'scaleY(1)';
    setTimeout(function () {
      html.setAttribute('data-theme', next);
      updateIcon();
      curtain.style.transform = 'scaleY(0)';
      setTimeout(function () { curtain.style.transition = 'none'; animating = false; }, DURATION + 80);
    }, DURATION);
  });
  updateIcon();
  var photos = document.querySelectorAll('.gallery-photo');
  if (prefersReduced) { photos.forEach(function (p) { p.classList.add('loaded'); }); }
  else {
    setTimeout(function () {
      photos.forEach(function (p, i) { setTimeout(function () { p.classList.add('loaded'); }, i * 130); });
    }, 400);
  }
  var pills = document.querySelectorAll('.filter-pill');
  var cards = document.querySelectorAll('.work-card');
  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var filter = pill.getAttribute('data-filter');
      pills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      document.body.classList.toggle('filter-active', filter !== 'all');
      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-cat') === filter;
        card.classList.toggle('hide', !match);
      });
    });
  });
  var btt = document.getElementById('backToTop');
  if (btt) btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
