/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: "https://bizbranches-theta.vercel.app",
    generateRobotsTxt: true,
    outDir: "./public",
    changefreq: "daily",
    priority: 0.7,
  
    additionalPaths: async (config) => {
      try {
        const res = await fetch("https://bizbranches-theta.vercel.app/api/business");
        const json = await res.json();
  
        console.log("📌 Sitemap API Response:", json); // Debugging
  
        // If API returns { data: [...] }
        const businesses = Array.isArray(json) ? json : json.data || [];
  
        return businesses.map((b) => ({
          loc: `/business/${b._id}`, // change to b.slug if your routes use slug
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
  