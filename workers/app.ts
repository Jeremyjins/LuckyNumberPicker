import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // CSP: inline styles allowed for Radix UI positioning; fonts from Google
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",
  ].join('; '),
};

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const response = await requestHandler(request, {
      cloudflare: { env, ctx },
    });
    const newResponse = new Response(response.body, response);

    // Security headers on all responses
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    // Cache-Control: HTML은 항상 재검증, 정적 자산은 1년 캐시
    const url = new URL(request.url);
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (acceptsHtml || url.pathname === '/') {
      newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/_assets/')
    ) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return newResponse;
  },
} satisfies ExportedHandler<Env>;
