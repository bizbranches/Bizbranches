/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Legacy direct business URL -> clean slug
      { source: '/business/:slug', destination: '/:slug', permanent: true },
      // Legacy nested city/category paths -> clean slug
      { source: '/city/:path*/business/:slug', destination: '/:slug', permanent: true },
      { source: '/category/:path*/business/:slug', destination: '/:slug', permanent: true },
    ]
  },
}

export default nextConfig
