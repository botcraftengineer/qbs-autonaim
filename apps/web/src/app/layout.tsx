import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin", "cyrillic"] })
const _geistMono = Geist_Mono({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "QBS Автонайм — AI-платформа для автоматизации найма персонала",
  description:
    "Автоматизируйте подбор персонала с помощью искусственного интеллекта. От отклика до интервью — без участия рекрутера. Экономьте до 90% времени на рутинных задачах найма. Интеграция с HH.ru и Telegram.",
  keywords: [
    "автоматизация найма",
    "AI рекрутинг",
    "подбор персонала",
    "HR автоматизация",
    "искусственный интеллект HR",
    "автонайм",
    "рекрутинг бот",
    "HH.ru интеграция",
    "Telegram рекрутинг",
    "скрининг кандидатов",
  ],
  authors: [{ name: "QBS" }],
  creator: "QBS",
  publisher: "QBS",
  generator: "v0.app",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://qbs-autonaim.ru",
    siteName: "QBS Автонайм",
    title: "QBS Автонайм — AI-платформа для автоматизации найма",
    description:
      "Автоматизируйте подбор персонала с помощью ИИ. Экономьте до 90% времени на рутине. Интеграция с HH.ru и Telegram.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QBS Автонайм — AI платформа для найма",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QBS Автонайм — AI-платформа для автоматизации найма",
    description: "Автоматизируйте подбор персонала с помощью ИИ. Экономьте до 90% времени на рутине.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "QBS Автонайм",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "AI-платформа для автоматизации найма персонала. Интеграция с HH.ru и Telegram.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "RUB",
                description: "Бесплатный тариф до 50 кандидатов в месяц",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                ratingCount: "127",
              },
            }),
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
