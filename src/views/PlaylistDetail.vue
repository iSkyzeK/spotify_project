<script setup>
import api from '@/api/spotify';
import { onMounted, ref, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
const route = useRoute();
const authStore = useAuthStore();
const accessToken = computed(() => authStore.accessToken);
const playlist = ref(null);
const tracks = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);
const offset = ref(0);
const totalTracks = ref(0);
const currentPage = ref(1);
const genres = ref({});
const showDialog = ref(false);
const selectedGenres = ref([]); // ✅ Ne pas pré-sélectionner
const selectedTracks = ref([]);
const isPublic = ref(false);
const name = ref('');
const description = ref('');
let selected = new Map();
const toast = useToast();

// 📌 Log des musiques sélectionnées sans doublons
const logSelectedTracks = async () => {
    try {
        const response = await api.post(
            `/users/${sessionStorage.getItem('user_id')}/playlists`,
            {
                name: name.value,
                description: description.value,
                public: isPublic.value
            }
        );
        const playlistId = response.data.id;
        if (selected.size > 50) {
            sendTracksToPlaylist(playlistId, selected);
        } else {
            await api.post(`/playlists/${playlistId}/tracks`, { uris: Array.from(selected.keys()) });
        }
    } catch (error) {
        console.error('❌ Erreur ajout des morceaux :', error.response?.data || error);
    }
};

const sendTracksToPlaylist = async (playlistId, selected) => {
    const trackUris = Array.from(selected.keys()); // Convertit la Map en tableau d'URIs
    const currentToken = accessToken.value;

    try {
        for (let i = 0; i < trackUris.length; i += 50) {
            const batch = trackUris.slice(i, i + 50); // Découpe en lots de 50
            await api.post(
                `/playlists/${playlistId}/tracks`,
                { uris: batch }
            );

            console.log(`✅ Envoyé ${i + 1}-${Math.min(i + 50, trackUris.length)} sur ${trackUris.length}`);
        }

        console.log('🎉 Tous les morceaux ont été ajoutés !');
    } catch (error) {
        console.error("❌ Erreur lors de l'ajout des morceaux :", error.response?.data || error);
    }
};

// 📌 Récupération des détails de la playlist
const fetchPlaylistDetails = async () => {
    isLoading.value = true;
    let artistsMap = new Map();
    let genresMap = new Map();
    let nextUrl = `https://api.spotify.com/v1/playlists/${route.params.id}`;

    try {
        let firstRequest = true;
        let allTracks = [];

        while (nextUrl) {
            const response = await api.get(nextUrl);
            if (firstRequest) {
                playlist.value = response.data;
                totalTracks.value = response.data.tracks.total;
            }

            let tracks = firstRequest ? response.data.tracks.items : response.data.items;
            firstRequest = false;

            tracks.forEach((track) => {
                allTracks.push(track.track);
                track.track.artists.forEach((artist) => {
                    artistsMap.set(artist.id, null);
                });
            });
            if (response.data.tracks?.next == undefined) {
                nextUrl = response.data.next;
            } else {
                nextUrl = response.data.tracks.next;
            }
            console.log(nextUrl);
        }

        console.log(`✅ Total morceaux trouvés : ${allTracks.length}`);

        // 📌 Récupération des artistes
        const artistsArray = [...artistsMap.keys()];
        let allArtists = [];

        for (let i = 0; i < artistsArray.length; i += 50) {
            const batch = artistsArray.slice(i, i + 50).join(',');
            const responseArtists = await api.get('/artists', {
                params: { ids: batch }
            });

            responseArtists.data.artists.forEach((artist) => {
                artistsMap.set(artist.id, artist);
                allArtists.push(artist);
            });
        }

        console.log(`✅ Total artistes détaillés récupérés : ${allArtists.length}`);

        // 📌 Association des morceaux aux genres sans doublons
        allTracks.forEach((track) => {
            track.artists.forEach((artist) => {
                let artistData = artistsMap.get(artist.id);
                if (artistData && artistData.genres) {
                    artistData.genres.forEach((genre) => {
                        if (!genresMap.has(genre)) {
                            genresMap.set(genre, new Map()); // Utiliser un Map pour éviter les doublons
                        }
                        genresMap.get(genre).set(track.id, { id: track.id, name: track.name });
                    });
                }
            });
        });

        // 📌 Transformation en objet clé-valeur propre
        genres.value = Object.fromEntries([...genresMap.entries()].map(([genre, tracksMap]) => [genre, Array.from(tracksMap.values())]));

        console.log(`✅ Genres associés aux morceaux :`, genres.value);

        fetchTracks(0);
    } catch (error) {
        console.error('❌ Erreur récupération playlist :', error);
        errorMessage.value = 'Impossible de récupérer la playlist.';
    } finally {
        isLoading.value = false;
    }
};

// 📌 Récupération des morceaux avec pagination
const fetchTracks = async (newOffset) => {
    isLoading.value = true;
    try {
        const response = await api.get(`/playlists/${route.params.id}/tracks`, {
            params: { limit: 20, offset: newOffset }
        });

        tracks.value = response.data.items;
        offset.value = newOffset;
        currentPage.value = Math.floor(newOffset / 20) + 1;
        totalTracks.value = response.data.total;
    } catch (error) {
        console.error('❌ Erreur récupération des morceaux :', error);
    } finally {
        isLoading.value = false;
    }
};
const addSelectedTracks = async () => {
    selectedGenres.value.forEach((genre) => {
        selectedTracks.value.push(genres.value[genre]);
    });
    Object.keys(selectedTracks.value).forEach((genre) => {
        if (selectedTracks.value[genre]) {
            selectedTracks.value[genre].forEach((track) => {
                if (!selected.has(track.id)) {
                    selected.set(`spotify:track:${track.id}`);
                }
            });
        }
    });
    console.log(selected);
};

const deleteTrack = async (trackUri, trackId) => {
    try {
        await api.delete(`/playlists/${playlist.value.id}/tracks`, {
            data: { tracks: [{ uri: trackUri }] }
        });
        tracks.value = tracks.value.filter((t) => t.track.id !== trackId);
        toast.add({ severity: 'success', summary: 'Supprimé', detail: 'Morceau supprimé', life: 3000 });
    } catch (error) {
        console.error('❌ Erreur suppression morceau :', error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression impossible', life: 3000 });
    }
};
onMounted(fetchPlaylistDetails);
watch(() => route.params.id, fetchPlaylistDetails);
</script>

<template>
    <div class="p-4">
        <Button label="⬅ Retour" class="p-button-outlined mb-4" @click="$router.push('/dashboard')" />

        <Card class="playlist-info mb-6" v-if="playlist">
            <template #header>
                <img v-if="playlist.images.length" :src="playlist.images[0].url" class="playlist-cover" />
            </template>
            <template #title>{{ playlist.name }}</template>
            <template #subtitle>Par {{ playlist.owner?.display_name }}</template>
            <template #content>
                <p class="text-sm text-gray-600">{{ playlist.description }}</p>
            </template>
        </Card>

        <h3 class="text-lg font-bold mt-4">📜 Morceaux</h3>

        <ProgressSpinner v-if="isLoading" />

        <div v-if="errorMessage" class="text-red-500">❌ {{ errorMessage }}</div>

        <div>
            <!-- Bouton pour ouvrir le dialogue -->
            <Button label="Sélectionner Genres" icon="pi pi-music" @click="showDialog = true" />

            <!-- Dialog de sélection des genres -->
            <Dialog v-model:visible="showDialog" modal header="Sélectionnez un genre" :style="{ width: '50vw' }">
                <div>
                    <label for="name" class="mr-2">Nom de la playlist</label>
                    <InputText id="name" v-model="name" class="w-full" />
                    <label for="description" class="mr-2">Description</label>
                    <InputText id="description" v-model="description" class="w-full" />

                    <Checkbox v-model="isPublic" :value="isPublic" :binary="true" />
                    <label for="isPublic" class="mr-2">Playlist publique</label>
                </div>
                <div class="p-fluid overflow-y-auto max-h-[250px]">
                    <div v-for="(tracks, genre) in genres" :key="genre">
                        <div class="genre-item">
                            <Checkbox v-model="selectedGenres" :inputId="genre" :value="genre" v-on:change="addSelectedTracks" />
                            <label :for="genre" class="ml-2">{{ genre }}</label>
                        </div>

                        <!-- Dropdown avec les morceaux du genre (pré-sélectionnés) -->
                        <Dropdown v-if="selectedGenres.includes(genre)" v-model="selectedTracks[genre]" :options="tracks" optionLabel="name" placeholder="Musiques du genre" class="w-full mt-2" multiple />
                    </div>
                </div>

                <!-- Bouton pour afficher les morceaux sélectionnés en console -->
                <template #footer>
                    <Button label="Afficher la sélection" icon="pi pi-check" @click="logSelectedTracks" />
                </template>
            </Dialog>
        </div>

        <!-- 🎵 Grid des morceaux -->
        <div v-if="tracks.length > 0" class="tracks-grid">
            <Card v-for="track in tracks" :key="track.track.id" class="track-card">
                <template #header>
                    <img :src="track.track.album.images[0]?.url" alt="Cover" class="track-cover" />
                </template>
                <template #title>{{ track.track.name }}</template>
                <template #subtitle>{{ track.track.artists.map((a) => a.name).join(', ') }}</template>
                <template #content>
                    <p class="text-gray-600 text-sm">{{ track.track.album.name }}</p>
                    <audio v-if="track.track.preview_url" :src="track.track.preview_url" controls class="w-full mt-2" />
                </template>
                <template #footer>
                    <div class="flex gap-2">
                        <a :href="track.track.external_urls.spotify" target="_blank" rel="noopener noreferrer" class="w-full">
                            <Button label="Écouter" icon="pi pi-play" class="p-button-sm p-button-success w-full" />
                        </a>
                        <Button label="Supprimer" icon="pi pi-trash" severity="danger" class="p-button-sm w-full" @click="deleteTrack(track.track.uri, track.track.id)" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- 🔄 Pagination -->
        <div class="pagination">
            <Button label="⬅ Précédent" :disabled="offset === 0" @click="fetchTracks(offset - 20)" />
            <span class="pagination-info">Page {{ currentPage }}</span>
            <Button label="Suivant ➡" :disabled="offset + 20 >= totalTracks" @click="fetchTracks(offset + 20)" />
        </div>
    </div>
</template>

<style scoped>
.playlist-cover {
    width: 100%;
    max-width: 400px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.genre-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}
/* 🎵 Grid des morceaux */
.tracks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive : 4 sur grand écran, 2 sur tablette, 1 sur mobile */
    gap: 20px;
    margin-top: 20px;
}

.track-card {
    transition: transform 0.2s ease-in-out;
    cursor: pointer;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.track-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.track-cover {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 8px;
}

.playlist-info {
    max-width: 400px;
}

/* 🔄 Pagination */
.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    gap: 20px;
}

.pagination-info {
    font-weight: bold;
    font-size: 1.2rem;
}
</style>
