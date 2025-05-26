<script setup>
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import api from '@/api/spotify';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import SuggestedTracks from '@/components/SuggestedTracks.vue';

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const userStore = useUserStore();
const authStore = useAuthStore();
const access_token = ref(authStore.accessToken);
const refresh_token = ref(authStore.refreshToken);
const code = sessionStorage.getItem('code');
const toast = useToast();
const playlists = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);

// 🚀 Fetch user data on mount
onMounted(async () => {
    if (refresh_token.value && !access_token.value) {
        console.log('🔄 Refreshing token...');
        access_token.value = await authStore.refreshAccessToken(clientId, clientSecret);
    }

    if (!access_token.value && code) {
        console.log('🔑 Obtaining new access token...');
        const tokens = await getAccessToken(clientId, code);
        authStore.setTokens(tokens.access_token, tokens.refresh_token);
        access_token.value = tokens.access_token;
    }

    if (access_token.value) {
        const profile = await fetchProfile();
        console.log('👤 Profile Retrieved:', profile);
        sessionStorage.setItem('user_id', profile.id);
        userStore.user = profile;
    }
    await fetchPlaylists();
});
// 🔄 Fonction pour obtenir un token d'accès
async function getAccessToken(clientId, code) {
    const verifier = sessionStorage.getItem('verifier');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', import.meta.env.VITE_SPOTIFY_REDIRECT_URI);
    params.append('code_verifier', verifier);

    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const { access_token, refresh_token } = await result.json();
    authStore.setTokens(access_token, refresh_token);
    return { access_token, refresh_token };
}

// 🔹 Récupérer le profil utilisateur
async function fetchProfile() {
    const response = await api.get('/me');
    return response.data;
}
const fetchPlaylists = async () => {
    if (!userStore.user?.id) {
        errorMessage.value = 'Utilisateur non connecté.';
        isLoading.value = false;
        return;
    }

    try {
        const response = await api.get(`/users/${userStore.user.id}/playlists`);

        playlists.value = response.data.items;
        console.log('✅ Playlists récupérées :', playlists.value);

        if (playlists.value.length === 0) {
            errorMessage.value = 'Aucune playlist trouvée.';
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des playlists :', error);
        errorMessage.value = 'Impossible de récupérer les playlists.';
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 3000 });
    } finally {
        isLoading.value = false;
    }
};
const goToPlaylist = (playlistId) => {
    router.push(`/playlist/${playlistId}`);
};
</script>
<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">🎵 Vos Playlists</h2>

        <!-- 🔄 Affichage du chargement -->
        <ProgressSpinner v-if="isLoading" />

        <!-- ❌ Affichage d'une erreur -->
        <div v-if="errorMessage" class="text-red-500">❌ {{ errorMessage }}</div>

        <!-- ✅ Affichage des playlists -->
        <div v-if="playlists.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card v-for="playlist in playlists" :key="playlist.id" class="playlist-card" @click="goToPlaylist(playlist.id)">
                <template #header>
                    <img v-if="playlist.images.length" :src="playlist.images[0].url" alt="Playlist Cover" class="playlist-cover" />
                </template>
                <template #title>{{ playlist.name }}</template>
                <template #subtitle>Par {{ playlist.owner?.display_name }}</template>
                <template #content>
                    <p class="text-sm text-gray-600">🎶 {{ playlist.tracks.total }} morceaux</p>
                </template>
                <template #footer>
                    <a :href="playlist.external_urls.spotify" target="_blank" rel="noopener noreferrer">
                        <Button label="Voir sur Spotify" icon="pi pi-external-link" class="p-button-sm p-button-outlined w-full" />
                    </a>
                </template>
            </Card>
        </div>
        <SuggestedTracks />
    </div>
</template>

<style scoped>
.playlist-card {
    cursor: pointer;
    transition: transform 0.2s;
}
.playlist-card:hover {
    transform: scale(1.05);
}
.playlist-cover {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 8px;
}
</style>
