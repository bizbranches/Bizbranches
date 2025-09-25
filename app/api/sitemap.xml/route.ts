import { getAllBusinessSlugs } from "@/lib/mongodb";

export async function GET() {
  const slugs = await getAllBusinessSlugs();

  const baseUrl = "https://bizbranches.com"; // apna domain yahan likho

  const urls = slugs
    .map(
      (slug) => `
    <url>
      <loc>${baseUrl}/business/${slug}</loc>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>
  `
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
