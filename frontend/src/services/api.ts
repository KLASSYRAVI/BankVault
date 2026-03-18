import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

api.interceptors.request.use((config) => {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                const newToken = res.data.data.accessToken;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                // Dispatch will be handled via store subscription
                window.dispatchEvent(
                    new CustomEvent('token-refresh', { detail: { token: newToken } })
                );
                return api(originalRequest);
            } catch {
                window.dispatchEvent(new CustomEvent('auth-logout'));
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
