import { routeService } from '@/service/routeService';
import { showToast } from '@/utils/toastService';
import { nextTick, ref } from 'vue';

export const useDialog = () => {
    const modelRef = ref({});
    const dialogTitle = ref(null);
    const displayConfirmDelete = ref(false);
    const displayDeleteSelected = ref(false);
    const dialogContent = ref(null);
    const displayDialog = ref(false);
    const routeIds = ref([]);
    const loadingRouteIds = ref(false);

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

    const autoCompleteToModel = (model, autoComplete, fields) => {
        if (model) {
            for (let field of fields) {
                model[field] = [...new Set([...autoComplete[field]])];
            }
        }
    };

    const modelToAutoComplete = (model, autoComplete, fields) => {
        if (model) {
            for (let field of fields) {
                autoComplete[field] = [...new Set([...model[field]])];
            }
        }
    };

    const autoCompeleteChip = (event, autoComplete, callback) => {
        const inputEl = event.target;
        const id = inputEl.id;
        const value = inputEl.value.trim();
        const field = autoComplete[id];
        if (value && value !== '' && field && Array.isArray(field) && !field.includes(value)) {
            autoComplete[id].push(value);
            autoComplete[id] = [...autoComplete[id]];
        }
        inputEl.value = '';
        if (callback) callback();
    };

    const fetchRouteId = async () => {
        try {
            if (routeIds.value.length > 0 || loadingRouteIds.value) return;
            loadingRouteIds.value = true;
            const res = await routeService.listRouteId();
            routeIds.value = res.data;
        } catch (error) {
            routeIds.value = [];
            showToast({ severity: 'error', summary: 'Failed to fetch route id', detail: error.message, life: 3000 });
        } finally {
            loadingRouteIds.value = false;
        }
    };

    return {
        showConfirmDelete,
        showConfirmDeleteSelected,
        scrollToFirstError,
        modelToAutoComplete,
        autoCompleteToModel,
        autoCompeleteChip,
        routeIds,
        loadingRouteIds,
        fetchRouteId,
        modelRef,
        dialogTitle,
        displayConfirmDelete,
        displayDeleteSelected,
        dialogContent,
        displayDialog
    };
};
