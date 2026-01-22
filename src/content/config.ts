import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Statut du post : published, draft, scheduled
    status: z.enum(['published', 'draft', 'scheduled']).default('draft'),

    // Date de publication (timestamp unique)
    publishedAt: z.coerce.date(),

    // Images attachées au post (max 4)
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional().default(''),
    })).max(4).optional().default([]),
  }),
});

export const collections = {
  posts: postsCollection,
};
