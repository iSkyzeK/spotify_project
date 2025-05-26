<script setup>
import api from '@/api/spotify';
import { useAuthStore } from '@/stores/auth';
import { computed, onMounted, ref } from 'vue';

const authStore = useAuthStore();
const accessToken = computed(() => authStore.accessToken);

const timeRange = ref('short_term');
const timeOptions = [
  { label: '1 mois', value: 'short_term' },
  { label: '6 mois', value: 'medium_term' },
  { label: '1 an', value: 'long_term' }
];

const topTracks = ref([]);
const topArtists = ref([]);
const audioFeatures = ref({});
const isLoading = ref(false);
const errorMessage = ref(null);

const listeningTime = computed(() => {
  const total = topTracks.value.reduce((sum, t) => sum + t.duration_ms, 0);
  return Math.round(total / 60000);
});

const fetchStats = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const tracksRes = await api.get('/me/top/tracks', {
      params: { limit: 10, time_range: timeRange.value }
    });
    const artistsRes = await api.get('/me/top/artists', {
      params: { limit: 10, time_range: timeRange.value }
    });
    topTracks.value = tracksRes.data.items;
    topArtists.value = artistsRes.data.items;

    // const ids = topTracks.value.map(t => t.id).join(',');
    // if (ids) {
    //   const featuresRes = await api.get('/audio-features', { params: { ids } });
    //   audioFeatures.value = featuresRes.data.audio_features.reduce((acc, f) => {
    //     acc[f.id] = f;
    //     return acc;
    //   }, {});
    // } else {
    //   audioFeatures.value = {};
    // }
  } catch (err) {
    console.error('Erreur stats', err);
    errorMessage.value = "Impossible de récupérer les statistiques.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchStats);
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">📊 Vos Statistiques</h2>
    <div class="mb-4">
      <Dropdown v-model="timeRange" :options="timeOptions" optionLabel="label" optionValue="value" @change="fetchStats" class="w-full md:w-40" />
    </div>
    <ProgressSpinner v-if="isLoading" />
    <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
    <div v-if="!isLoading && !errorMessage">
      <h3 class="text-lg font-semibold mb-2">🎵 Top 10 chansons</h3>
      <ul class="mb-6">
        <li v-for="track in topTracks" :key="track.id" class="mb-2 flex items-center">
          <img :src="track.album.images[0]?.url" alt="cover" class="w-10 h-10 rounded mr-2" />
          <span class="font-medium">{{ track.name }}</span>
          <span class="text-sm text-gray-500 ml-1">- {{ track.artists.map(a => a.name).join(', ') }}</span>
          <div v-if="audioFeatures[track.id]" class="ml-2 text-xs text-gray-600">
            Énergie: {{ audioFeatures[track.id].energy }},
            Dansabilité: {{ audioFeatures[track.id].danceability }},
            Valence: {{ audioFeatures[track.id].valence }}
          </div>
        </li>
      </ul>
      <h3 class="text-lg font-semibold mb-2">🎤 Top 10 artistes</h3>
      <ul class="mb-6">
        <li v-for="artist in topArtists" :key="artist.id" class="mb-2 flex items-center">
          <img :src="artist.images[0]?.url" alt="artist" class="w-10 h-10 rounded-full mr-2" />
          <span class="font-medium">{{ artist.name }}</span>
        </li>
      </ul>
      <h3 class="text-lg font-semibold mb-2">⏱ Temps d'écoute approximatif</h3>
      <p>{{ listeningTime }} minutes</p>
    </div>
  </div>
</template>

<style scoped>
</style>
