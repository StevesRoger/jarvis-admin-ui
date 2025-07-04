<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/authStore';
import { initToast } from './utils/toastService';
onMounted(() => {
    initToast();
    useAuthStore().fetchPublicKey();
});
</script>

<template>
    <router-view />
</template>

<style scoped></style>
