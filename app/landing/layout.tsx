import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TrackDoc - Gestão Inteligente de Documentos com IA | Plataforma Empresarial',
  description: 'Revolucione a gestão de documentos da sua empresa com TrackDoc. Assinatura eletrônica, workflow automatizado, IA para criação de documentos e muito mais. Comece grátis!',
  keywords: [
    'gestão de documentos',
    'assinatura eletrônica',
    'workflow automatizado',
    'IA documentos',
    'plataforma empresarial',
    'gestão digital',
    'automação de processos',
    'compliance',
    'auditoria documentos',
    'trackdoc'
  ],
  authors: [{ name: 'TrackDoc Team' }],
  creator: 'TrackDoc',
  publisher: 'TrackDoc',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://trackdoc.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TrackDoc - Gestão Inteligente de Documentos com IA',
    description: 'Revolucione a gestão de documentos da sua empresa com TrackDoc. Assinatura eletrônica, workflow automatizado, IA para criação de documentos e muito mais.',
    url: 'https://trackdoc.com.br',
    siteName: 'TrackDoc',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TrackDoc - Gestão Inteligente de Documentos',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackDoc - Gestão Inteligente de Documentos com IA',
    description: 'Revolucione a gestão de documentos da sua empresa com TrackDoc. Assinatura eletrônica, workflow automatizado, IA para criação de documentos.',
    images: ['/twitter-image.png'],
    creator: '@trackdoc',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "TrackDoc",
            "description": "Plataforma de gestão inteligente de documentos com IA, assinatura eletrônica e workflow automatizado para empresas.",
            "url": "https://trackdoc.com.br",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "29",
              "priceCurrency": "BRL",
              "priceValidUntil": "2025-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "500"
            },
            "author": {
              "@type": "Organization",
              "name": "TrackDoc"
            },
            "publisher": {
              "@type": "Organization",
              "name": "TrackDoc",
              "logo": {
                "@type": "ImageObject",
                "url": "https://trackdoc.com.br/logo-horizontal-preto.png"
              }
            }
          })
        }}
      />
      {children}
    </>
  )
}
