import { getAllBusinessSlugs } from "@/lib/mongodb";

export const dynamic = 'force-dynamic'

export async function GET() {
  const slugs = await getAllBusinessSlugs();
  const baseUrl = process.env.NODE_ENV === 'production' ? "https://bizbranches.pk" : "https://bizbranches-theta.vercel.app";
  
  console.log('Sitemap: Found', slugs.length, 'business slugs:', slugs);

  // Static pages
  const staticPages = [
    { url: "", priority: "1.0", changefreq: "daily" },
    { url: "/search", priority: "0.9", changefreq: "daily" },
    { url: "/add", priority: "0.8", changefreq: "weekly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/contact", priority: "0.6", changefreq: "monthly" },
    { url: "/privacy", priority: "0.5", changefreq: "yearly" },
  ];

  const staticUrls = staticPages
    .map(
      (page) => `
    <url>
      <loc>${baseUrl}${page.url}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("");

  const businessUrls = slugs
    .map(
      (slug) => `
    <url>
      <loc>${baseUrl}/${slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${businessUrls}
<!-- Found ${slugs.length} businesses -->
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache"
    },
  });
}
