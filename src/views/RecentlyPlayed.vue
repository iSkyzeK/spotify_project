<script setup>
import { onMounted, ref } from 'vue';
import api from '@/api/spotify';

const recent = ref([]);
const isLoading = ref(false);
const errorMessage = ref(null);

const fetchRecent = async () => {
    isLoading.value = true;
    try {
        const { data } = await api.get('/me/player/recently-played', { params: { limit: 20 } });
        recent.value = data.items;
    } catch (err) {
        errorMessage.value = 'Impossible de récupérer l\'historique';
        console.error(err);
    } finally {
        isLoading.value = false;
    }
};

const openLink = (url) => {
    window.open(url, '_blank');
};

onMounted(fetchRecent);
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">🎧 Récemment écoutés</h2>
        <ProgressSpinner v-if="isLoading" />
        <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
        <div v-if="recent.length" class="tracks-grid">
            <Card v-for="item in recent" :key="item.played_at" class="track-card" @click="openLink(item.track.external_urls.spotify)">
                <template #header>
                    <img :src="item.track.album.images[0]?.url" class="track-cover" />
                </template>
                <template #title>{{ item.track.name }}</template>
                <template #subtitle>{{ item.track.artists.map(a => a.name).join(', ') }}</template>
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
