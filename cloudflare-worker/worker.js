/**
 * Cloudflare Worker - Proxy CORS pour GitHub OAuth Device Flow
 */

export default {
  async fetch(request) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Parse URL
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to GitHub endpoints
    let targetUrl;
    if (path === '/device/code') {
      targetUrl = 'https://github.com/login/device/code';
    } else if (path === '/oauth/access_token') {
      targetUrl = 'https://github.com/login/oauth/access_token';
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Forward to GitHub
      const body = request.method === 'POST' ? await request.text() : undefined;

      const githubResponse = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'MicroBlog-OAuth-Proxy',
        },
        body,
      });

      const data = await githubResponse.text();

      return new Response(data, {
        status: githubResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
