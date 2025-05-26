<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api/spotify';

const tracks = ref([]);
const isLoading = ref(false);
const errorMessage = ref(null);

const fetchLiked = async () => {
    isLoading.value = true;
    try {
        const { data } = await api.get('/me/tracks', { params: { limit: 20 } });
        tracks.value = data.items;
    } catch (e) {
        console.error(e);
        errorMessage.value = "Impossible de récupérer les musiques likées";
    } finally {
        isLoading.value = false;
    }
};

const removeTrack = async (id) => {
    try {
        await api.delete('/me/tracks', { params: { ids: id } });
        tracks.value = tracks.value.filter(t => t.track.id !== id);
    } catch (e) {
        console.error(e);
    }
};

const openLink = (url) => {
    window.open(url, '_blank');
};

onMounted(fetchLiked);
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">💚 Musiques likées</h2>
        <ProgressSpinner v-if="isLoading" />
        <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
        <div v-if="tracks.length" class="tracks-grid">
            <Card v-for="item in tracks" :key="item.track.id" class="track-card" @click="openLink(item.track.external_urls.spotify)">
                <template #header>
                    <img :src="item.track.album.images[0]?.url" class="track-cover" />
                </template>
                <template #title>{{ item.track.name }}</template>
                <template #subtitle>{{ item.track.artists.map(a => a.name).join(', ') }}</template>
                <template #footer>
                    <Button icon="pi pi-trash" severity="danger" class="p-button-sm w-full" @click="removeTrack(item.track.id)" />
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
</style>
