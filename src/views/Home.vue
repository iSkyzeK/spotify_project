<script setup>
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/spotify';
import { useToast } from 'primevue/usetoast';
import { ref, watch, computed } from 'vue';


const userStore = useUserStore();
const authStore = useAuthStore();
const access_token = computed(() => authStore.accessToken);
const filteredTracks = ref('')
const playlist = ref(null);
const tracks = ref([]); // ✅ Store all tracks separately
const isLoading = ref(false);
const errorMessage = ref(null);
const artist = ref('');
const toast = useToast();
const search = ref('');
const displayDialog = ref(false);

// 🔄 Function to fetch playlist & tracks (with pagination)
const fetchPlaylist = async (playlistId) => {
    isLoading.value = true;
    tracks.value = []; // Reset tracks

    try {
        // Fetch playlist details
        const playlistResponse = await api.get(`/playlists/${playlistId}`);

        playlist.value = playlistResponse.data;
        console.log("🎵 Playlist Retrieved:", playlist.value);
        const totalTracks = playlist.value.tracks.total;
        const limit = 100;
        let offset = 0;

        // Fetch tracks with pagination
        while (offset < totalTracks) {
            const trackResponse = await api.get(`/playlists/${playlistId}/tracks`, {
                params: { limit, offset }
            });
            tracks.value = tracks.value.concat(trackResponse.data.items);
            offset += limit;
        }
        filteredTracks.value = tracks.value;
        isLoading.value = false;
    } catch (error) {
        errorMessage.value = error.message;
        toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 3000 });
        isLoading.value = false;
    }
};

// 🔍 Extract Playlist ID from Spotify URL
const standardizeUrl = (url) => {
    const regex = /https:\/\/open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[2] : null;
};

// 🔍 Search Handler
const fetchEntity = async () => {
    const playlistId = standardizeUrl(search.value);
    if (!playlistId) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'URL Spotify invalide', life: 3000 });
        return;
    }
    await fetchPlaylist(playlistId);
};


const deleteTracks = async () => {
    const tracksUri = filteredTracks.value.map(t=> ({uri:t.track.uri}));
    console.log(tracksUri)
    await api.delete(`/playlists/${playlist.value.id}/tracks`, {
        data: { tracks: tracksUri }
    });
    displayDialog.value = false;
}
watch(artist, async () => {
    if(artist.value.length > 2) {
        filteredTracks.value = tracks.value.filter(t=> t.track.artists[0].name
        .toLocaleLowerCase().includes(artist.value.toLocaleLowerCase()));
    }
    else {
        filteredTracks.value = tracks.value;
    }

});
</script>

<template>
    <div class="p-4">
        <Message severity="success">Bienvenue sur Spotify</Message>
        <p v-if="userStore.user">👤 Connecté en tant que {{ userStore.user?.display_name }}</p>
        <p v-else>🔄 Connexion en cours...</p>

        <!-- Input & Button -->
        <div class="mb-4">
            <InputText default-value="https://open.spotify.com/playlist/3mLNDkROovyTlvZy4ucpwh?si=62a83601edf747be" class="w-full mb-2" v-model="search" @keydown.enter.prevent="fetchEntity" placeholder="Collez le lien Spotify ici" />
            <InputText  class="w-full mb-2" v-model="artist" placeholder="Entrez le nom d'un artiste " />
            <Button label="Trouver une playlist" icon="pi pi-search" class="p-button-primary w-full" @click="fetchEntity" />
            <Button label="Supprimer les musiques sélectionnées" v-if="artist.length>2" v-on:click="displayDialog = true" icon="pi pi-trash" severity="danger" class="p-button-primary w-full" />
        </div>

        <!-- Loading Spinner -->
        <ProgressSpinner v-if="isLoading" />

        <!-- Error Message -->
        <div v-if="errorMessage" class="text-red-500">
            ❌ {{ errorMessage }}
        </div>

        <!-- Playlist Details -->
        <div v-if="playlist" class="playlist-container">
            <Card class="playlist-card">
                <template #header>
                </template>
                <template #title>{{ playlist.name }}</template>
                <template #subtitle>Par {{ playlist.owner?.display_name }}</template>
                <template #content>
                    <p class="mb-3">{{ playlist.description || "Pas de description" }}</p>

                    <!-- Track List -->
                    <h3 class="text-lg font-bold mb-2">🎶 Morceaux :</h3>
                    <ul>
                        <li v-for="track in filteredTracks" :key="track.track.id" class="mb-2 flex items-center">
                            <img :src="track.track.album.images[0]?.url" alt="Album Cover" class="w-10 h-10 rounded mr-2" />
                            <span class="font-medium">{{ track.track.name }}</span> - 
                            <span class="text-sm text-gray-500">{{ track.track.artists.map(a => a.name).join(', ') }}</span>
                        </li>
                    </ul>
                </template>
                <template #footer>
                    <Button label="Écouter sur Spotify" icon="pi pi-play"
                        class="p-button-success" :href="playlist.external_urls?.spotify" target="_blank" />
                </template>
            </Card>
            <Dialog v-model="displayDialog" header="Header" :visible="displayDialog" style="width: 50vw" @hide="displayDialog = false">
                <div>
                    Voulez vous vraiment supprimer :
                    <ul class="overflow-y-scroll h-96">
                        <li v-for="track in filteredTracks" :key="track.track.id" class="mb-2 flex items-center">
                            <img :src="track.track.album.images[0]?.url" alt="Album Cover" class="w-10 h-10 rounded mr-2" />
                            <span class="font-medium">{{ track.track.name }}</span> -
                            <span class="text-sm text-gray-500">{{ track.track.artists.map(a => a.name).join(', ') }}</span>
                        </li>
                    </ul>
                    <div>
                        <Button @click="displayDialog = false" severity="danger" label="Annuler" class="w-full" icon="pi pi-times"/>
                        <Button @click="deleteTracks" severity="success" label="Confirmer" class="w-full" icon="pi pi-check"/>
                    </div>
                </div>
            </Dialog>
        </div>
    </div>
</template>

<style scoped>
.playlist-container {
    max-width: 600px;
    margin: 0 auto;
}
</style>
