/**
 * Wrapper pour l'API GitHub
 */

import { getToken } from './auth';

const GITHUB_REPO = import.meta.env.PUBLIC_GITHUB_REPO || '';
const API_BASE = 'https://api.github.com';

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubError {
  message: string;
  status: number;
  isRateLimit?: boolean;
  isAuth?: boolean;
}

// Headers communs pour les requêtes GitHub
function getHeaders(): HeadersInit {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

// Gestion des erreurs
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: GitHubError = {
      message: 'Une erreur est survenue',
      status: response.status,
    };

    if (response.status === 401) {
      error.message = 'Non authentifié. Veuillez vous reconnecter.';
      error.isAuth = true;
    } else if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining === '0') {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date();
        error.message = `Limite de requêtes atteinte. Réessayez après ${resetDate.toLocaleTimeString('fr-FR')}.`;
        error.isRateLimit = true;
      } else {
        error.message = 'Accès refusé.';
      }
    } else if (response.status === 404) {
      error.message = 'Fichier ou ressource non trouvé.';
    } else if (response.status === 422) {
      const data = await response.json();
      error.message = data.message || 'Données invalides.';
    }

    throw error;
  }

  // Certaines réponses n'ont pas de contenu (204)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Récupérer le contenu d'un fichier ou dossier
 */
export async function getRepoContents(path: string): Promise<GitHubFile | GitHubFile[]> {
  const response = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`,
    { headers: getHeaders() }
  );

  return handleResponse(response);
}

/**
 * Récupérer un fichier avec son contenu décodé
 */
export async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const file = await getRepoContents(path) as GitHubFile;

  if (!file.content || file.encoding !== 'base64') {
    throw { message: 'Impossible de lire le contenu du fichier', status: 400 } as GitHubError;
  }

  const content = atob(file.content);
  return { content, sha: file.sha };
}

/**
 * Créer ou mettre à jour un fichier
 */
export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<{ commit: { sha: string }; content: GitHubFile }> {
  const body: Record<string, string> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))), // Encoder en base64 avec support UTF-8
    branch: 'main',
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }
  );

  return handleResponse(response);
}

/**
 * Supprimer un fichier
 */
export async function deleteFile(path: string, message: string, sha: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        sha,
        branch: 'main',
      }),
    }
  );

  return handleResponse(response);
}

/**
 * Uploader une image
 */
export async function uploadImage(
  path: string,
  base64Content: string,
  message: string
): Promise<{ content: GitHubFile }> {
  // Retirer le préfixe data:image/...;base64, si présent
  const cleanBase64 = base64Content.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        content: cleanBase64,
        branch: 'main',
      }),
    }
  );

  return handleResponse(response);
}

/**
 * Récupérer les limites de l'API
 */
export async function getRateLimit(): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const response = await fetch(`${API_BASE}/rate_limit`, {
    headers: getHeaders(),
  });

  const data = await handleResponse<{
    resources: { core: { limit: number; remaining: number; reset: number } };
  }>(response);

  return {
    limit: data.resources.core.limit,
    remaining: data.resources.core.remaining,
    reset: new Date(data.resources.core.reset * 1000),
  };
}

/**
 * Vérifier si le repo existe et est accessible
 */
export async function checkRepoAccess(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}`, {
      headers: getHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Lister les fichiers d'un dossier
 */
export async function listFiles(path: string): Promise<GitHubFile[]> {
  const contents = await getRepoContents(path);
  return Array.isArray(contents) ? contents : [contents];
}

/**
 * Récupérer les posts depuis le repo
 */
export async function getPostsFromRepo(): Promise<GitHubFile[]> {
  try {
    const files = await listFiles('src/content/posts');
    return files.filter((f) => f.name.endsWith('.md'));
  } catch (error) {
    const err = error as GitHubError;
    if (err.status === 404) {
      return [];
    }
    throw error;
  }
}
