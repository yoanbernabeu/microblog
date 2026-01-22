import { getCollection, type CollectionEntry } from 'astro:content';
import { formatDistanceToNow, format, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';

export type Post = CollectionEntry<'posts'>;

export interface PostWithHashtags extends Post {
  hashtags: string[];
}

/**
 * Récupère tous les posts publiés, triés par date décroissante
 */
export async function getPublishedPosts(): Promise<PostWithHashtags[]> {
  const posts = await getCollection('posts', ({ data }) => {
    // En mode dev, montrer aussi les brouillons
    if (import.meta.env.DEV) {
      return data.status !== 'scheduled' || new Date(data.publishedAt) <= new Date();
    }
    // En production, seulement les posts publiés avec une date passée
    return data.status === 'published' && new Date(data.publishedAt) <= new Date();
  });

  return posts
    .map((post) => ({
      ...post,
      hashtags: extractHashtags(post.body || ''),
    }))
    .sort((a, b) =>
      new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
    );
}

/**
 * Récupère tous les posts (pour l'admin)
 */
export async function getAllPosts(): Promise<PostWithHashtags[]> {
  const posts = await getCollection('posts');

  return posts
    .map((post) => ({
      ...post,
      hashtags: extractHashtags(post.body || ''),
    }))
    .sort((a, b) =>
      new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
    );
}

/**
 * Récupère un post par son timestamp
 */
export async function getPostByTimestamp(timestamp: string): Promise<PostWithHashtags | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === timestamp || post.id.replace('.md', '') === timestamp);
}

/**
 * Récupère tous les posts avec un hashtag spécifique
 */
export async function getPostsByHashtag(tag: string): Promise<PostWithHashtags[]> {
  const posts = await getPublishedPosts();
  const normalizedTag = tag.toLowerCase();

  return posts.filter((post) =>
    post.hashtags.some((h) => h.toLowerCase() === normalizedTag)
  );
}

/**
 * Extrait les hashtags d'un texte
 */
export function extractHashtags(text: string): string[] {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);

  if (!matches) return [];

  // Retirer le # et dédupliquer
  return [...new Set(matches.map((tag) => tag.slice(1)))];
}

/**
 * Récupère tous les hashtags uniques avec leur compte
 */
export async function getAllHashtags(): Promise<Map<string, number>> {
  const posts = await getPublishedPosts();
  const tagCounts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.hashtags) {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    }
  }

  return tagCounts;
}

/**
 * Formate une date de post
 * - Si < 48h : format relatif ("il y a 2 heures")
 * - Sinon : format absolu ("22 janvier 2024")
 */
export function formatPostDate(date: Date): string {
  const now = new Date();
  const hoursDiff = differenceInHours(now, date);

  if (hoursDiff < 48) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  }

  return format(date, 'd MMMM yyyy', { locale: fr });
}

/**
 * Formate une date pour l'attribut datetime
 */
export function formatDatetime(date: Date): string {
  return date.toISOString();
}

/**
 * Transforme le contenu du post en HTML avec les liens et hashtags cliquables
 */
export function parsePostContent(content: string, baseUrl: string = ''): string {
  let html = escapeHtml(content);

  // Transformer les URLs en liens cliquables
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  html = html.replace(urlRegex, (url) => {
    const displayUrl = url.length > 50 ? url.slice(0, 47) + '...' : url;
    return `<a href="${url}" class="link" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
  });

  // Transformer les hashtags en liens
  const hashtagRegex = /#(\w+)/g;
  html = html.replace(hashtagRegex, (_, tag) => {
    return `<a href="${baseUrl}/tag/${tag.toLowerCase()}" class="hashtag">#${tag}</a>`;
  });

  // Transformer les sauts de ligne
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Extrait le premier lien d'un texte
 */
export function extractFirstLink(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[1] : null;
}

/**
 * Détecte si un lien est une URL YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url);
}

/**
 * Extrait l'ID d'une vidéo YouTube
 */
export function extractYouTubeId(url: string): string | null {
  const regexes = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) return match[1];
  }

  return null;
}
