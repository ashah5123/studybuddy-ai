import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studybuddy.ai'
const APP_NAME = 'StudyBuddy'
const APP_DESCRIPTION =
  'Get instant, subject-specific explanations for any question. Build your knowledge with flashcards, quizzes, and a personal notebook — all in one place.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Smart Study Assistant`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'study assistant',
    'homework help',
    'flashcards',
    'quizzes',
    'student tools',
    'learning',
    'education',
    'study notes',
    'subject help',
  ],
  authors: [{ name: 'StudyBuddy' }],
  creator: 'StudyBuddy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Smart Study Assistant`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Smart Study Assistant`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Smart Study Assistant`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og.png`],
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
