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
