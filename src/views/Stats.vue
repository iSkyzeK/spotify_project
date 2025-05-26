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

const topLimit = ref(10);
const limitOptions = [10, 20, 50, 100].map(n => ({ label: `Top ${n}`, value: n }));

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
      params: { limit: topLimit.value, time_range: timeRange.value }
    });
    const artistsRes = await api.get('/me/top/artists', {
      params: { limit: topLimit.value, time_range: timeRange.value }
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

const openLink = (url) => {
  window.open(url, '_blank');
};

onMounted(fetchStats);
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">📊 Vos Statistiques</h2>
    <div class="mb-4 flex flex-col md:flex-row gap-2">
      <Dropdown v-model="timeRange" :options="timeOptions" optionLabel="label" optionValue="value" @change="fetchStats" class="w-full md:w-40" />
      <Dropdown v-model="topLimit" :options="limitOptions" optionLabel="label" optionValue="value" @change="fetchStats" class="w-full md:w-40" />
    </div>
    <ProgressSpinner v-if="isLoading" />
    <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
    <div v-if="!isLoading && !errorMessage">
      <h3 class="text-lg font-semibold mb-2">🎵 Top {{ topLimit }} chansons</h3>
      <div class="tracks-grid mb-6">
        <Card v-for="track in topTracks" :key="track.id" class="track-card" @click="openLink(track.external_urls.spotify)">
          <template #header>
            <img :src="track.album.images[0]?.url" alt="cover" class="track-cover" />
          </template>
          <template #title>{{ track.name }}</template>
          <template #subtitle>{{ track.artists.map(a => a.name).join(', ') }}</template>
        </Card>
      </div>
      <h3 class="text-lg font-semibold mb-2">🎤 Top {{ topLimit }} artistes</h3>
      <div class="tracks-grid mb-6">
        <Card v-for="artist in topArtists" :key="artist.id" class="track-card" @click="openLink(artist.external_urls.spotify)">
          <template #header>
            <img :src="artist.images[0]?.url" alt="artist" class="track-cover rounded-full object-cover" />
          </template>
          <template #title>{{ artist.name }}</template>
        </Card>
      </div>
      <h3 class="text-lg font-semibold mb-2">⏱ Temps d'écoute approximatif</h3>
      <p>{{ listeningTime }} minutes</p>
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
