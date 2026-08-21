const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-maps',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        }
      }
    },
    {
      // OFFLINE: dataset de áreas del mapa. NetworkFirst = datos frescos con
      // cobertura, y el último dataset descargado cuando no la hay.
      // DEBE ir ANTES de la regla genérica /api/* NetworkOnly.
      // Incluye ?lang=xx (i18n). Debe ir ANTES de /api/* NetworkOnly.
      urlPattern: /\/api\/areas(?:\?.*)?$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'areas-data',
        networkTimeoutSeconds: 20,
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 2 * 60 * 60
        }
      }
    },
    {
      // OFFLINE: tiles y estilos de MapTiler (MapLibre)
      urlPattern: /^https:\/\/api\.maptiler\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'map-tiles',
        expiration: {
          maxEntries: 600,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
        }
      }
    },
    {
      // OFFLINE: tiles de OpenStreetMap (Leaflet)
      urlPattern: /^https:\/\/[abc]?\.?tile\.openstreetmap\.org\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'osm-tiles',
        expiration: {
          maxEntries: 600,
          maxAgeSeconds: 30 * 24 * 60 * 60
        }
      }
    },
    {
      // NUNCA cachear el resto de rutas de API - siempre datos frescos
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly'
    },
    {
      // Solo cachear llamadas auth de Supabase (login/signup), no datos
      urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-auth',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 1 * 60 * 60 // 1 hora
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Solo HTTPS. TODO: restringir a los dominios reales de fotos
    // (Supabase Storage, etc.) para evitar abuso del optimizador de Vercel.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  compiler: {
    // Eliminar console.log en producción (mantiene error/warn)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // SEGURIDAD: nunca exponer claves secretas vía `env` (se inyectan en el bundle).
  // Las variables de servidor (SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, etc.)
  // están disponibles automáticamente en API routes en Vercel.
};

module.exports = withPWA(nextConfig);
