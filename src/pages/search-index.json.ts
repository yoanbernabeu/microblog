import type { APIContext } from 'astro';
import { getPublishedPosts } from '@lib/posts';
import { truncateText } from '@lib/utils';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  const rawBaseUrl = import.meta.env.BASE_URL;
  const baseUrl = rawBaseUrl === '/' ? '' : rawBaseUrl.replace(/\/$/, '');

  const searchIndex = posts.map((post) => {
    const content = post.body || '';
    const postSlug = post.slug || post.id.replace('.md', '');

    return {
      id: postSlug,
      content: content,
      hashtags: post.hashtags.join(' '),
      date: post.data.publishedAt.toISOString(),
      url: `${baseUrl}/post/${postSlug}`,
      excerpt: truncateText(content, 150),
    };
  });

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
