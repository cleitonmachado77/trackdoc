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
    optimizePackageImports: [
      '@supabase/ssr', 
      '@supabase/supabase-js', 
      'lucide-react', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'recharts'
    ],
    missingSuspenseWithCSRBailout: false,
    // Otimizações adicionais
    serverComponentsExternalPackages: ['@supabase/ssr'],
    optimizeServerReact: true,
  },
  

  
  // ✅ Compilação otimizada para produção
  swcMinify: true,
  compress: true,
  
  // ✅ Output padrão para Vercel (removido standalone que pode causar problemas)
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // ✅ Headers de cache para produção
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // ✅ Otimizações de webpack para produção
  webpack: (config, { dev, isServer }) => {
    // Otimizações para desenvolvimento também
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para bibliotecas grandes
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              enforce: true
            },
            // Chunk separado para Supabase
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              chunks: 'all',
              priority: 30,
              enforce: true
            },
            // Chunk para UI components
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              chunks: 'all',
              priority: 25,
              enforce: true
            },
            // Chunk para gráficos
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              chunks: 'all',
              priority: 24,
              enforce: true
            },
            // Commons chunk para código compartilhado
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    // Otimizações adicionais
    if (!dev) {
      config.optimization.minimize = true
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
  

  
  // ✅ Compilador otimizado
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // ✅ Configurações de performance
  reactStrictMode: false,
}

export default nextConfig