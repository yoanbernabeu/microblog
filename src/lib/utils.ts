/**
 * Tronque un texte à une longueur donnée
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Génère un timestamp unique pour un nouveau post
 */
export function generateTimestamp(): string {
  return Date.now().toString();
}

/**
 * Valide qu'un texte respecte la limite de caractères
 */
export function validatePostLength(text: string, maxLength: number = 280): boolean {
  return text.length > 0 && text.length <= maxLength;
}

/**
 * Compte les caractères restants
 */
export function getRemainingChars(text: string, maxLength: number = 280): number {
  return maxLength - text.length;
}

/**
 * Génère un slug à partir d'un texte
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formate la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Vérifie si une URL est valide
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Nettoie une URL pour l'affichage
 */
export function cleanUrlForDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    let display = parsed.hostname;
    if (parsed.pathname !== '/') {
      display += parsed.pathname;
    }
    return display.length > 40 ? display.slice(0, 37) + '...' : display;
  } catch {
    return url.slice(0, 40);
  }
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Délai en millisecondes (pour les animations/timeouts)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce une fonction
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Vérifie si on est côté client
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Copie du texte dans le presse-papiers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Métadonnées Open Graph d'une URL
 */
export interface OGMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

/**
 * Récupère les métadonnées Open Graph d'une URL
 */
export async function fetchOGMetadata(url: string): Promise<OGMetadata> {
  const defaultMetadata: OGMetadata = {
    title: null,
    description: null,
    image: null,
    siteName: null,
    favicon: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MicroBlog/1.0; +https://github.com)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return defaultMetadata;

    const html = await response.text();
    const parsed = new URL(url);

    // Extraction des métadonnées via regex (pas de DOM côté serveur)
    const getMetaContent = (property: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return decodeHtmlEntities(match[1]);
      }
      return null;
    };

    // Extraction du titre
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : null;

    // Extraction du favicon
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i);
    let favicon = faviconMatch ? faviconMatch[1] : null;

    // Résoudre les URLs relatives pour le favicon
    if (favicon && !favicon.startsWith('http')) {
      favicon = favicon.startsWith('/')
        ? `${parsed.origin}${favicon}`
        : `${parsed.origin}/${favicon}`;
    }

    // Résoudre les URLs relatives pour l'image OG
    let ogImage = getMetaContent('og:image') || getMetaContent('twitter:image');
    if (ogImage && !ogImage.startsWith('http')) {
      ogImage = ogImage.startsWith('/')
        ? `${parsed.origin}${ogImage}`
        : `${parsed.origin}/${ogImage}`;
    }

    return {
      title: getMetaContent('og:title') || getMetaContent('twitter:title') || pageTitle,
      description: getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description'),
      image: ogImage,
      siteName: getMetaContent('og:site_name') || parsed.hostname,
      favicon: favicon || `${parsed.origin}/favicon.ico`,
    };
  } catch {
    return defaultMetadata;
  }
}

/**
 * Décode les entités HTML
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}
