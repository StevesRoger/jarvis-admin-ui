import { defineStore } from 'pinia';

export const useMenuStore = defineStore('menuStore', {
    state: () => ({
        loading: false
    }),
    actions: {
        setLoading(state) {
            this.loading = state;
        }
    },
    persist: true
});
