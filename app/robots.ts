import { MetadataRoute } from 'next'

const baseUrl = 'https://www.mapafurgocasa.com'

const publicAllow = [
  '/',
  '/mapa',
  '/area/',
  '/ruta',
  '/sobre-nosotros',
  '/contacto',
  '/privacidad',
  '/condiciones',
]

const publicDisallow = [
  '/admin/',
  '/api/',
  '/perfil',
]

/** Crawlers de IA bienvenidos (OpenAI, Anthropic, Google, Perplexity, Apple, Meta). */
const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
  'meta-externalagent',
] as const

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          ...publicAllow,
          '/auth/',
        ],
        disallow: publicDisallow,
      },
      {
        userAgent: 'Googlebot',
        allow: publicAllow,
        disallow: [
          ...publicDisallow,
          '/auth/',
        ],
      },
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        allow: publicAllow,
        disallow: publicDisallow,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
