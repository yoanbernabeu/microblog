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
  }
});
