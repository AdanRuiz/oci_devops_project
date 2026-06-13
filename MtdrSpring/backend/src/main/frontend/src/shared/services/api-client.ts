import type { ApiResult } from '../dtos/api-result.dto';

/**
 * Generic HTTP client for the Spring Boot backend.
 * The React dev-server proxy (package.json → "proxy": "http://localhost:8080")
 * forwards all unmatched requests to the backend, so we use relative URLs.
 */

async function request<T>(
    url: string,
    options: RequestInit = {}
): Promise<ApiResult<T>> {
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => res.statusText);
            return {
                success: false,
                data: null as unknown as T,
                message: `HTTP ${res.status}: ${errorText}`,
            };
        }

        // Handle 204 No Content
        if (res.status === 204) {
            return { success: true, data: null as unknown as T };
        }

        const data: T = await res.json();
        return { success: true, data };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Network error';
        return { success: false, data: null as unknown as T, message };
    }
}

export const apiClient = {
    get<T>(url: string): Promise<ApiResult<T>> {
        return request<T>(url);
    },

    post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
        return request<T>(url, { method: 'POST', body: JSON.stringify(body) });
    },

    put<T>(url: string, body: unknown): Promise<ApiResult<T>> {
        return request<T>(url, { method: 'PUT', body: JSON.stringify(body) });
    },

    delete<T>(url: string): Promise<ApiResult<T>> {
        return request<T>(url, { method: 'DELETE' });
    },
};
