/**
 * Resolve the public backend base URL for browser and server contexts.
 *
 * Production (Cloudflare): UI and /api/v1 share the same origin — use window.location.origin.
 * Local dev: UI on :3010, API on :8000 — set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000.
 */

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function getServerBackendUrl(): string {
  return process.env.BACKEND_URL || 'http://api:8000';
}

/** Browser-safe backend URL for API calls, WebSocket, MCP, etc. */
export function getPublicBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const override = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (override && isLocalDevOrigin(origin)) {
      return trimTrailingSlash(override);
    }

    return trimTrailingSlash(origin);
  }

  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_BACKEND_URL
      || process.env.BACKEND_URL
      || 'http://api:8000',
  );
}

export const PUBLIC_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://voice.genuinestack.com';
