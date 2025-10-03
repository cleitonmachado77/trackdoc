/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Configurações otimizadas para PRODUÇÃO
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/ssr', 'lucide-react'],
  },
  
  // ✅ Compilação otimizada para produção
  swcMinify: true,
  compress: true,
  
  // ✅ Headers de cache para produção
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // ✅ Otimizações de webpack para produção
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // ✅ Otimizações apenas para produção
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      }
    }
    return config
  },
  
  // ✅ Configurações de produção
  poweredByHeader: false,
  generateEtags: false,
  
  // ✅ Otimizações de imagem
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
}

module.exports = nextConfig
