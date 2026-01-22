/**
 * Module d'authentification GitHub OAuth
 * Supporte : Device Flow (recommande) et Personal Access Token (fallback)
 */

const GITHUB_CLIENT_ID = import.meta.env.PUBLIC_GITHUB_CLIENT_ID || '';
const GITHUB_REPO = import.meta.env.PUBLIC_GITHUB_REPO || '';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

// ============================================
// Device Flow (OAuth sans secret cote client)
// ============================================

/**
 * Demande un device code a GitHub
 * L'utilisateur devra aller sur github.com/login/device et entrer le user_code
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get device code: ${error}`);
  }

  return response.json();
}

/**
 * Poll GitHub pour verifier si l'utilisateur a autorise l'app
 */
export async function pollForToken(deviceCode: string): Promise<TokenResponse | null> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });

  const data = await response.json();

  // Erreurs attendues pendant le polling
  if (data.error === 'authorization_pending') {
    return null; // L'utilisateur n'a pas encore autorise
  }

  if (data.error === 'slow_down') {
    return null; // Trop de requetes, attendre plus
  }

  if (data.error === 'expired_token') {
    throw new Error('Le code a expire. Veuillez recommencer.');
  }

  if (data.error === 'access_denied') {
    throw new Error('Acces refuse par l\'utilisateur.');
  }

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  if (data.access_token) {
    return data as TokenResponse;
  }

  return null;
}

/**
 * Lance le Device Flow complet avec polling
 */
export async function startDeviceFlow(
  onUserCode: (code: string, url: string) => void,
  onSuccess: (token: string) => void,
  onError: (error: string) => void
): Promise<() => void> {
  let cancelled = false;

  try {
    const deviceCodeResponse = await requestDeviceCode();

    // Afficher le code a l'utilisateur
    onUserCode(deviceCodeResponse.user_code, deviceCodeResponse.verification_uri);

    // Polling
    const interval = (deviceCodeResponse.interval || 5) * 1000;
    const expiresAt = Date.now() + deviceCodeResponse.expires_in * 1000;

    const poll = async () => {
      if (cancelled) return;

      if (Date.now() > expiresAt) {
        onError('Le code a expire. Veuillez recommencer.');
        return;
      }

      try {
        const tokenResponse = await pollForToken(deviceCodeResponse.device_code);

        if (tokenResponse) {
          setToken(tokenResponse.access_token);
          onSuccess(tokenResponse.access_token);
          return;
        }

        // Continue polling
        setTimeout(poll, interval);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    };

    // Start polling
    setTimeout(poll, interval);

  } catch (error) {
    onError(error instanceof Error ? error.message : 'Erreur lors de l\'initialisation');
  }

  // Return cancel function
  return () => {
    cancelled = true;
  };
}

// ============================================
// Token Management
// ============================================

export function setToken(token: string): void {
  sessionStorage.setItem('github_token', token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('github_token');
}

export function clearToken(): void {
  sessionStorage.removeItem('github_token');
  sessionStorage.removeItem('github_user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============================================
// GitHub API
// ============================================

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

export async function verifyRepoAccess(): Promise<boolean> {
  const token = getToken();
  if (!token || !GITHUB_REPO) return false;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function logout(): void {
  clearToken();
  window.location.href = `${import.meta.env.BASE_URL}/admin/login`;
}

export function getClientId(): string {
  return GITHUB_CLIENT_ID;
}

export function getRepoName(): string {
  return GITHUB_REPO;
}
