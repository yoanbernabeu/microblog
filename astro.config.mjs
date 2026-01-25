import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://yoanbernabeu.github.io',
  base: '/microblog',
  integrations: [
    tailwind()
  ],
  output: 'static',
  build: {
    assets: 'assets'
  },
  image: {
    // Optimisation des images avec Sharp
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
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
