<script setup>
import api from '@/api/spotify';
import { onMounted, ref } from 'vue';

const suggestions = ref([]);
const isLoading = ref(false);
const errorMessage = ref(null);

const fetchSuggestions = async () => {
    isLoading.value = true;
    errorMessage.value = null;
    try {
        const topRes = await api.get('/me/top/tracks', { params: { limit: 3 } });
        const seeds = topRes.data.items.map(t => t.id).join(',');
        const recRes = await api.get('/recommendations', { params: { seed_tracks: seeds, limit: 10 } });
        suggestions.value = recRes.data.tracks;
    } catch (err) {
        console.error('Erreur recommandations', err);
        errorMessage.value = "Impossible de r\xE9cup\xE9rer les suggestions.";
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchSuggestions);
</script>

<template>
    <div class="mt-8">
        <h3 class="text-lg font-semibold mb-2">\uD83C\uDFA7 Suggestions personnalis\u00E9es</h3>
        <ProgressSpinner v-if="isLoading" />
        <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
        <div v-if="suggestions.length" class="tracks-grid">
            <Card v-for="track in suggestions" :key="track.id" class="track-card">
                <template #header>
                    <img :src="track.album.images[0]?.url" alt="cover" class="track-cover" />
                </template>
                <template #title>{{ track.name }}</template>
                <template #subtitle>{{ track.artists.map(a => a.name).join(', ') }}</template>
                <template #footer>
                    <a :href="track.external_urls.spotify" target="_blank" rel="noopener noreferrer" class="w-full">
                        <Button label="Ouvrir dans Spotify" icon="pi pi-external-link" class="p-button-sm w-full" />
                    </a>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.tracks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.track-card {
    transition: transform 0.2s ease-in-out;
    cursor: pointer;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    height: 100%;
}

.track-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.track-card .p-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.track-card .p-card-footer {
    margin-top: auto;
}

.track-cover {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 8px;
}
</style>
