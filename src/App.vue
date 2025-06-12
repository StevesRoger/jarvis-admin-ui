<script setup>
import { onMounted } from 'vue';
import { initToast } from './utils/toastService';

onMounted(() => {
    initToast(); // Initialize toast inside setup
});
</script>

<template>
    <router-view />
</template>

<style scoped></style>
