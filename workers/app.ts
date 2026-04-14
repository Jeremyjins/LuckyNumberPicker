import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    nonce: string;
  }
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
  ].join('; ');
}

const STATIC_SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const nonce = generateNonce();
    const response = await requestHandler(request, {
      cloudflare: { env, ctx },
      nonce,
    });
    const newResponse = new Response(response.body, response);

    // Security headers on all responses
    Object.entries(STATIC_SECURITY_HEADERS).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    newResponse.headers.set('Content-Security-Policy', buildCSP(nonce));

    // Cache-Control
    const url = new URL(request.url);
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');

    if (url.pathname === '/sw.js') {
      newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (url.pathname === '/manifest.json') {
      newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    } else if (acceptsHtml || url.pathname === '/') {
      newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/_assets/')
    ) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/pwa-') ||
      url.pathname.startsWith('/maskable-') ||
      url.pathname.startsWith('/apple-touch-icon')
    ) {
      newResponse.headers.set('Cache-Control', 'public, max-age=86400, must-revalidate');
    }

    return newResponse;
  },
} satisfies ExportedHandler<Env>;
