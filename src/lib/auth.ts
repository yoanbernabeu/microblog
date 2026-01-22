/**
 * Module d'authentification GitHub OAuth (PKCE flow côté client)
 */

const GITHUB_CLIENT_ID = import.meta.env.PUBLIC_GITHUB_CLIENT_ID || '';
const GITHUB_REPO = import.meta.env.PUBLIC_GITHUB_REPO || '';

// Générer un code verifier pour PKCE
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Générer le code challenge à partir du verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Construire l'URL d'autorisation GitHub
export async function getAuthorizationUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Stocker le verifier pour l'échange de token
  sessionStorage.setItem('github_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${window.location.origin}${import.meta.env.BASE_URL}/admin/callback`,
    scope: 'repo',
    state: generateCodeVerifier(), // CSRF protection
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  // Stocker le state pour vérification
  sessionStorage.setItem('github_oauth_state', params.get('state') || '');

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// Échanger le code contre un token
export async function exchangeCodeForToken(code: string, state: string): Promise<string | null> {
  const storedState = sessionStorage.getItem('github_oauth_state');
  const codeVerifier = sessionStorage.getItem('github_code_verifier');

  // Vérifier le state (CSRF)
  if (state !== storedState) {
    console.error('Invalid OAuth state');
    return null;
  }

  if (!codeVerifier) {
    console.error('Missing code verifier');
    return null;
  }

  try {
    // Note: L'échange de token nécessite normalement un backend
    // car GitHub n'accepte pas les requêtes CORS pour /login/oauth/access_token
    // On utilise ici un proxy ou une fonction serverless
    // Pour simplifier, on stocke le token manuellement dans l'interface

    // Clean up
    sessionStorage.removeItem('github_oauth_state');
    sessionStorage.removeItem('github_code_verifier');

    // Retourner null - l'utilisateur devra entrer son token manuellement
    return null;
  } catch (error) {
    console.error('Token exchange failed:', error);
    return null;
  }
}

// Stocker le token
export function setToken(token: string): void {
  sessionStorage.setItem('github_token', token);
}

// Récupérer le token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('github_token');
}

// Supprimer le token
export function clearToken(): void {
  sessionStorage.removeItem('github_token');
}

// Vérifier si l'utilisateur est authentifié
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Récupérer les infos de l'utilisateur GitHub
export async function getGitHubUser(): Promise<GitHubUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get GitHub user:', error);
    return null;
  }
}

// Vérifier si l'utilisateur est propriétaire du repo
export async function isRepoOwner(): Promise<boolean> {
  const user = await getGitHubUser();
  if (!user) return false;

  const [owner] = GITHUB_REPO.split('/');
  return user.login.toLowerCase() === owner.toLowerCase();
}

// Déconnecter l'utilisateur
export function logout(): void {
  clearToken();
  window.location.href = `${import.meta.env.BASE_URL}/admin/login`;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}
