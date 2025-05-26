<script setup>
import router from '@/router';
import { defineProps, onMounted } from 'vue';
const props = defineProps({
    code: String
});
onMounted(() => {
    sessionStorage.setItem('code', props.code);
    router.push('/dashboard');
});
</script>

<template></template>
