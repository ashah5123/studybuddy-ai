import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studybuddy.ai'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup'],
        disallow: ['/dashboard', '/ask', '/notebook', '/analytics', '/settings', '/upgrade', '/billing', '/parent', '/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
