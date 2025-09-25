/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || "https://bizbranches-theta.vercel.app", // change to your real domain
    generateRobotsTxt: true,
    outDir: "./public",
    changefreq: "daily",
    priority: 0.7,
    additionalPaths: async (config) => {
      try {
        const res = await fetch("https://bizbranches-theta.vercel.app/api/business");
        const json = await res.json();
        const businesses = Array.isArray(json) ? json : json.data || [];
  
        return businesses.map((b) => ({
          loc: `/business/${b._id}`, // change to b.slug if needed
          changefreq: "daily",
          priority: 0.7,
          lastmod: new Date().toISOString(),
        }));
      } catch (err) {
        console.error("❌ Error fetching businesses for sitemap:", err);
        return [];
      }
    },
  };
  