import { nextTick, ref } from 'vue';

export const useDialog = () => {
    const modelRef = ref({});
    const dialogTitle = ref(null);
    const displayConfirmDelete = ref(false);
    const displayDeleteSelected = ref(false);
    const dialogContent = ref(null);
    const displayDialog = ref(false);

    const showConfirmDelete = (prod) => {
        modelRef.value = prod;
        displayConfirmDelete.value = true;
    };

    const showConfirmDeleteSelected = () => {
        displayDeleteSelected.value = true;
    };

    const scrollToFirstError = () => {
        nextTick(() => {
            const dialogEl = dialogContent.value;
            if (!dialogEl) return;
            const firstErrorEl = document.querySelector('.p-invalid');
            if (firstErrorEl) {
                firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorEl.focus();
                const inputEl = firstErrorEl.querySelector('input');
                if (inputEl) inputEl.focus();
            }
        });
    };

    return { showConfirmDelete, showConfirmDeleteSelected, scrollToFirstError, modelRef, dialogTitle, displayConfirmDelete, displayDeleteSelected, dialogContent, displayDialog };
};
