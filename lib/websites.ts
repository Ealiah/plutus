export type Website = {
  id: string;
  name: string;
  url: string;
  description: string;
  sortOrder: number;
  createdAt: number;
};

export const WEBSITE_NAME_MAX = 80;
export const WEBSITE_URL_MAX = 500;
export const WEBSITE_DESC_MAX = 160;

/**
 * Accepts what people actually paste ("acme.com", "www.acme.com/work") and returns
 * an absolute http(s) URL, or null when it can't be made into one. Anything other
 * than http/https is rejected so a card can never carry a javascript: payload.
 */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > WEBSITE_URL_MAX) return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname.includes(".")) return null;

  return parsed.toString();
}

/** "https://www.acme.com/work" -> "acme.com" — used as the card's sub-label. */
export function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
