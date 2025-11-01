import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verificar Assinatura - TrackDoc | Verificação Pública de Assinaturas Eletrônicas',
  description: 'Verifique a autenticidade e validade de assinaturas eletrônicas do TrackDoc. Ferramenta pública para validação de documentos assinados digitalmente.',
  keywords: [
    'verificar assinatura',
    'assinatura eletrônica',
    'validação digital',
    'verificação pública',
    'autenticidade documento',
    'hash criptográfico',
    'ICP-Brasil',
    'lei 14.063',
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
  metadataBase: new URL('https://www.trackdoc.com.br'),
  alternates: {
    canonical: '/verify-signature',
  },
  openGraph: {
    title: 'Verificar Assinatura - TrackDoc',
    description: 'Verifique a autenticidade e validade de assinaturas eletrônicas do TrackDoc. Ferramenta pública para validação de documentos assinados digitalmente.',
    url: 'https://www.trackdoc.com.br/verify-signature',
    siteName: 'TrackDoc',
    images: [
      {
        url: '/og-verify-signature.png',
        width: 1200,
        height: 630,
        alt: 'TrackDoc - Verificação de Assinaturas',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verificar Assinatura - TrackDoc',
    description: 'Verifique a autenticidade e validade de assinaturas eletrônicas do TrackDoc.',
    images: ['/twitter-verify-signature.png'],
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
  category: 'technology',
}

export default function VerifySignatureLayout({
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
            "@type": "WebApplication",
            "name": "Verificação de Assinaturas TrackDoc",
            "description": "Ferramenta pública para verificação de assinaturas eletrônicas",
            "url": "https://www.trackdoc.com.br/verify-signature",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "BRL"
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
                "url": "https://www.trackdoc.com.br/logo-horizontal-preto.png"
              }
            }
          })
        }}
      />
      {children}
    </>
  )
}
