import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_DEV_TARGET ?? 'http://localhost:3000'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Convención · Panel',
          short_name: 'Panel',
          description: 'Panel interno de la Convención Juvenil 2026',
          theme_color: '#4f46e5',
          background_color: '#f1f5f9',
          display: 'standalone',
          orientation: 'any',
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /\/inscripciones(\?.*)?$/,
              handler: 'StaleWhileRevalidate'
            },
            {
              urlPattern: /\/pagos\/[a-z]+(\?.*)?$/,
              handler: 'StaleWhileRevalidate'
            },
            {
              urlPattern: /\/equipos(\/[a-z0-9]+)?(\?.*)?$/,
              handler: 'StaleWhileRevalidate'
            }
          ]
        }
      })
    ],
    server: {
      proxy: {
        '/inscripciones': { target, changeOrigin: true },
        '/checkin': { target, changeOrigin: true },
        '/pagos': { target, changeOrigin: true },
        '/equipos': { target, changeOrigin: true }
      }
    }
  }
})