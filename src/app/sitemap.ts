import type { MetadataRoute } from "next";

const BASE_URL = "https://www.kept.co.il";

// Only the public, indexable routes — /dashboard/*, /r/[id], /settings/*,
// and /api/* are intentionally excluded (private or per-request dynamic).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, priority: 1 },
    { url: `${BASE_URL}/signup`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/login`, lastModified: now, priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: now, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, priority: 0.3 },
  ];
}
