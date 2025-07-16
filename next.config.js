/** @type {import('next').NextConfig} */
const nextConfig = {
  // Active les optimisations
  swcMinify: true,
  
  // Headers de cache pour les assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=9999999999, must-revalidate',
          },
        ],
      },
    ]
  },

  // Optimisation expérimentales
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig

