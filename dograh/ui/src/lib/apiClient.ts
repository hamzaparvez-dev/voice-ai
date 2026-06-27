import type { Client } from '@/client/client';
import type { CreateClientConfig } from '@/client/client.gen';

import { getPublicBackendUrl, getServerBackendUrl } from '@/lib/backendUrl';

export { getPublicBackendUrl, getServerBackendUrl } from '@/lib/backendUrl';

export const createClientConfig: CreateClientConfig = (config) => {
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer ? getServerBackendUrl() : getPublicBackendUrl();

    return {
        ...config,
        baseUrl,
    };
};

let interceptorRegistered = false;

/**
 * Register a request interceptor that attaches a fresh access token
 * to every outgoing SDK request. Idempotent — safe for React strict mode.
 */
export function setupAuthInterceptor(apiClient: Client, getAccessToken: () => Promise<string>) {
    if (interceptorRegistered) return;
    interceptorRegistered = true;

    apiClient.interceptors.request.use(async (request) => {
        if (request.headers.get('Authorization')) {
            return request;
        }
        try {
            const token = await getAccessToken();
            request.headers.set('Authorization', `Bearer ${token}`);
        } catch {
            // If token retrieval fails, let the request proceed without auth
        }
        return request;
    });
}
