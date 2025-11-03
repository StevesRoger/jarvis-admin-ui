import { authService } from '@/service/authService';
import { errorReslover } from '@/utils/request';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        isError: ref(null),
        isAuthenticated: false,
        publicKey: null
    }),
    actions: {
        setAuthenticated(state) {
            this.isAuthenticated = state;
        },
        setError(state) {
            this.isError = state;
        },
        async fetchPublicKey() {
            try {
                this.publicKey = await authService.getPublicKey();
            } catch (error) {
                const msg = errorReslover(error) + ', failed to fetch public key.';
                console.warn(msg);
            }
        }
    },
    persist: true
});
