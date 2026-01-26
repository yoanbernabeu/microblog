/**
 * Cloudflare Worker - Proxy CORS pour GitHub OAuth Device Flow
 *
 * Deploiement :
 * 1. Va sur https://workers.cloudflare.com/
 * 2. Cree un compte ou connecte-toi
 * 3. Cree un nouveau Worker
 * 4. Colle ce code
 * 5. Deploy
 * 6. Copie l'URL (ex: https://ton-worker.ton-compte.workers.dev)
 * 7. Ajoute PUBLIC_GITHUB_PROXY_URL=https://ton-worker... dans ton .env
 */

const ALLOWED_ORIGINS = [
  'http://localhost:4321',
  'http://localhost:3000',
  'https://yoanbernabeu.github.io',
  'https://microblog.yoandev.co',
];

const ALLOWED_GITHUB_ENDPOINTS = [
  'https://github.com/login/device/code',
  'https://github.com/login/oauth/access_token',
];

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    // Verify origin
    const origin = request.headers.get('Origin');
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Get target URL from path
    const url = new URL(request.url);
    const targetPath = url.pathname.slice(1); // Remove leading /

    let targetUrl;
    if (targetPath === 'device/code') {
      targetUrl = 'https://github.com/login/device/code';
    } else if (targetPath === 'oauth/access_token') {
      targetUrl = 'https://github.com/login/oauth/access_token';
    } else {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // Forward request to GitHub
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'MicroBlog-OAuth-Proxy',
        },
        body: request.method !== 'GET' ? await request.text() : undefined,
      });

      const data = await response.text();

      // Return response with CORS headers
      return new Response(data, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

function handleCORS(request) {
  const origin = request.headers.get('Origin');

  if (!isAllowedOrigin(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}
