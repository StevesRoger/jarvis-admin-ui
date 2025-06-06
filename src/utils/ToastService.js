import { useToast } from 'primevue/usetoast';

let toast;

export function initToast() {
    toast = useToast();
}

export function showToast(options) {
    if (toast) {
        toast.add(options);
    } else {
        console.warn('Toast is not initialized. Call initToast() inside setup().');
    }
}
