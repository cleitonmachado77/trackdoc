/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Configuração para SSR (Server-Side Rendering)
  // Removido 'output: export' para permitir rotas de API
  trailingSlash: true,
  images: {
    // Você pode usar o otimizador de imagens do Next.js em produção
    // unoptimized: true, // Remova isso se for fazer deploy na Vercel
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
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
  
  
  // ✅ Configurações de build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Desabilitar prerendering para todas as páginas que usam autenticação
  experimental: {
    ...nextConfig.experimental,
    missingSuspenseWithCSRBailout: false,
  },
  
  // ✅ Compilador otimizado
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // ✅ Configurações de performance
  reactStrictMode: false,
}

export default nextConfig