import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: sessionStorage.getItem('access_token') || null,
        refreshToken: sessionStorage.getItem('refresh_token') || null
    }),
    getters: {
        isAuthenticated: (state) => !!state.accessToken
    },
    actions: {
        setTokens(access, refresh) {
            this.accessToken = access;
            this.refreshToken = refresh;
            sessionStorage.setItem('access_token', access);
            if (refresh) {
                sessionStorage.setItem('refresh_token', refresh);
            }
        },
        async refreshAccessToken(clientId, clientSecret) {
            if (!this.refreshToken) return null;
            try {
                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret)
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: this.refreshToken
                    })
                });
                const data = await response.json();
                if (data.access_token) {
                    this.setTokens(data.access_token, data.refresh_token || this.refreshToken);
                    return data.access_token;
                }
                return null;
            } catch (error) {
                console.error('Failed to refresh token', error);
                return null;
            }
        },
        logout() {
            this.accessToken = null;
            this.refreshToken = null;
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('code');
            sessionStorage.removeItem('verifier');
        }
    }
});
