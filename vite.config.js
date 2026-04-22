import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // No generar SW en desarrollo (evitar problemas de caché)
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'data/*.geojson',
        'data/*.json',
        'pwa-*.png',
      ],
      manifest: {
        name: 'Riobamba Rutas - Transporte Público',
        short_name: 'RíoRutas',
        description: 'Rutas de transporte público de Riobamba, Ecuador. App offline-first con mapa interactivo y buscador de rutas.',
        theme_color: '#1e3a5f',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        lang: 'es',
        categories: ['navigation', 'travel', 'utilities'],
        icons: [
          {
            src: 'pwa-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'pwa-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'pwa-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'pwa-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'pwa-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Shortcuts para acceso rápido desde el icono de la app
        shortcuts: [
          {
            name: 'Buscar ruta',
            short_name: 'Buscar',
            description: '¿Qué bus tomo? Busca rutas entre dos puntos',
            url: '/what-bus',
            icons: [{ src: 'pwa-96x96.png', sizes: '96x96' }],
          },
          {
            name: 'Ver líneas',
            short_name: 'Líneas',
            description: 'Lista de todas las líneas de transporte',
            url: '/lines',
            icons: [{ src: 'pwa-96x96.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        // Precachear todos los assets estáticos
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webmanifest}',
          'data/**/*.{geojson,json}',
        ],
        // No precachear chunks mayores a 5MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Limpiar precaché viejo automáticamente al actualizar
        cleanupOutdatedCaches: true,
        // Activar nuevo SW inmediatamente sin esperar cierre de pestañas
        skipWaiting: true,
        // Estrategias de caché en runtime
        runtimeCaching: [
          // Tiles de OpenStreetMap (con subdominios a/b/c) - CacheFirst
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Tiles de OpenStreetMap (URL sin subdominio) - CacheFirst
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Recursos de Leaflet CDN - CacheFirst
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-cdn',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts CSS - StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts archivos - CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  // Configuración de build optimizada para producción
  build: {
    chunkSizeWarningLimit: 800,
    // Minificación con esbuild (más rápida que terser en Vite 8)
    minify: 'esbuild',
    target: 'es2020',
    // No generar sourcemaps en producción
    sourcemap: false,
    // Rollup output options
    rollupOptions: {
      output: {
        // Nombres de archivo con hash para cache-busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Code splitting: separar vendor chunks para mejor caché
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-leaflet'
            }
            if (id.includes('@turf')) {
              return 'vendor-turf'
            }
            if (id.includes('zustand') || id.includes('localforage')) {
              return 'vendor-state'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            // Otros node_modules
            return 'vendor'
          }
        },
      },
    },
  },
})
