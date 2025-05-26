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

onMounted(fetchRecent);
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">🎧 Récemment écoutés</h2>
        <ProgressSpinner v-if="isLoading" />
        <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
        <ul v-if="recent.length" class="space-y-2">
            <li v-for="item in recent" :key="item.played_at" class="flex items-center">
                <img :src="item.track.album.images[0]?.url" class="w-10 h-10 rounded mr-2" />
                <div>
                    <p class="font-medium">{{ item.track.name }}</p>
                    <p class="text-xs text-gray-500">{{ item.track.artists.map(a => a.name).join(', ') }}</p>
                </div>
            </li>
        </ul>
    </div>
</template>

<style scoped></style>
