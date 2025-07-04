import { useToast } from 'primevue/usetoast';

let toast;

export const initToast = () => {
    toast = useToast();
};

export const showToast = (options) => {
    if (toast) {
        toast.add(options);
    } else {
        console.warn('Toast is not initialized. Call initToast() inside setup().');
    }
};
