import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
    baseURL: 'https://api.spotify.com/v1'
});

api.interceptors.request.use((config) => {
    const auth = useAuthStore();
    if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            const auth = useAuthStore();
            const newToken = await auth.refreshAccessToken(
                import.meta.env.VITE_SPOTIFY_CLIENT_ID,
                import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
            );
            if (newToken) {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return api.request(error.config);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
