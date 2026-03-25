import { getAuth } from './auth.js';

const API_BASE_URL = 'http://localhost:3001/api';

export async function apiClient(endpoint, { method = 'GET', body, headers = {} } = {}) {
    const auth = getAuth();

    const config = {
        method,
        headers: { ...headers },
    };

    if (auth && auth.token) {
        config.headers['Authorization'] = `Bearer ${auth.token}`;
    }

    if (body instanceof FormData) {
        config.body = body;
    } else if (body) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            console.warn('API returned 401 Unauthorized. Session may be expired.');
            // In a real app we might trigger a logout or token refresh here
        }

        let errorMsg = 'API request failed';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
            // Ignore json parse error
        }
        throw new Error(errorMsg);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    return await response.json();
}
