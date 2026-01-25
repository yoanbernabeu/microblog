import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://microblog.yoandev.co',
  base: '/',
  integrations: [
    tailwind()
  ],
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },
  build: {
    assets: 'assets'
  },
  image: {
    // Optimisation des images avec Sharp
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
        jpeg: { quality: 60 },
        webp: { quality: 60 },
        png: { quality: 60, compressionLevel: 9 },
      },
    },
    // Domaines autorisés pour les images distantes
    remotePatterns: [
      {
        protocol: 'https',
      },
    ],
  },
  vite: {
    build: {
      // Optimisation des assets
      assetsInlineLimit: 4096,
    },
  },
});
