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

onMounted(fetchLiked);
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-bold mb-4">💚 Musiques likées</h2>
        <ProgressSpinner v-if="isLoading" />
        <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
        <ul v-if="tracks.length" class="space-y-2">
            <li v-for="item in tracks" :key="item.track.id" class="flex items-center">
                <img :src="item.track.album.images[0]?.url" class="w-10 h-10 rounded mr-2" />
                <div class="flex-1">
                    <p class="font-medium">{{ item.track.name }}</p>
                    <p class="text-xs text-gray-500">{{ item.track.artists.map(a => a.name).join(', ') }}</p>
                </div>
                <Button icon="pi pi-trash" severity="danger" @click="removeTrack(item.track.id)" />
            </li>
        </ul>
    </div>
</template>

<style scoped></style>
