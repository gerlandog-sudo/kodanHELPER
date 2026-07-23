import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'kodanHELPER',
        short_name: 'kHELPER',
        description: 'Organizador Inteligente de Ideas, Tareas y Reuniones',
        theme_color: '#0b1326',
        background_color: '#0b1326',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192-v2.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['productivity', 'utilities'],
        lang: 'es',
        dir: 'ltr',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
