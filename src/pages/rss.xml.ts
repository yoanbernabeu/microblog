import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '@lib/posts';
import { getConfig } from '@lib/config';
import { truncateText } from '@lib/utils';

export async function GET(context: APIContext) {
  const config = getConfig();
  const posts = await getPublishedPosts();
  const baseUrl = import.meta.env.BASE_URL;

  return rss({
    title: config.site.name,
    description: config.site.description,
    site: context.site?.toString() || '',
    items: posts.map((post) => {
      const content = post.body || '';
      const postSlug = post.slug || post.id.replace('.md', '');

      return {
        title: truncateText(content.replace(/#\w+/g, '').trim(), 100),
        pubDate: post.data.publishedAt,
        description: truncateText(content, 280),
        link: `${baseUrl}/post/${postSlug}`,
        content: content,
      };
    }),
    customData: `<language>${config.site.language}</language>`,
  });
}
