/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: "https://bizbranches-theta.vercel.app", // change to your domain later
    generateRobotsTxt: true,
    outDir: "./public",
    changefreq: "daily",
    priority: 0.7,
  
    // Fetch dynamic routes (e.g., posts, news, listings)
    transform: async (config, path) => {
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: config.priority,
        lastmod: new Date().toISOString(),
      };
    },
  
    additionalPaths: async (config) => {
      // Example: fetch posts from your API or DB
      const res = await fetch("https://api.bizbranches.pk/posts"); 
      const posts = await res.json();
  
      return posts.map((post) => ({
        loc: `/posts/${post.slug}`, // Adjust path as per your Next.js routes
        changefreq: "daily",
        priority: 0.7,
        lastmod: new Date().toISOString(),
      }));
    },
  };
  