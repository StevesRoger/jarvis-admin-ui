import { useDataTable } from '@/composables/useDataTable';
import { useDialog } from '@/composables/useDialog';
import { routeSecurityService } from '@/service/routeSecurityService';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { ref } from 'vue';

const globalFilterFields = ref(['id', 'patterns', 'methods', 'order', 'createdBy', 'type', 'roles', 'status']);
const { exportCSV, initTableParam, buildQueryParam, loadingTable, dt, page, limit, totalRecords, mapFilterType, filterMatchMode, isFilter, selectedItem, isEdit, loadingSubmit, list } = useDataTable({ globalFilterFields: globalFilterFields.value });
const { showConfirmDelete, showConfirmDeleteSelected, scrollToFirstError, modelRef, dialogTitle, displayConfirmDelete, displayDeleteSelected, dialogContent, displayDialog } = useDialog();

const routeIds = ref([]);
const loadingRouteIds = ref(false);

const excludeField = ['updatedBy', 'updatedDate', 'createdBy', 'createdDate'];
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: { value: null, matchMode: FilterMatchMode.EQUALS },
    routeId: { value: null, matchMode: FilterMatchMode.EQUALS },
    patterns: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    methods: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    roles: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    order: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'number' },
    type: { value: null, matchMode: FilterMatchMode.EQUALS },
    authenticated: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    denyAll: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    permitAll: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdBy: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdDate: { value: null, matchMode: FilterMatchMode.DATE_IS, dataType: 'date' }
});

const dropDownType = ref([
    { label: 'BEARER', value: 'BEARER' },
    { label: 'BASIC', value: 'BASIC' }
]);
const autoComplete = ref({ patterns: [], methods: [], roles: [] });
const errorMessage = ref({ pattern: null });

const fetchRouteRedirect = async () => {
    try {
        loadingTable.value = true;
        selectedItem.value = null;
        const res = await routeSecurityService.listRouteSecurity(buildQueryParam());
        const data = res.data;
        list.value = data.item;
        totalRecords.value = data.totalRecord;
    } catch (error) {
        list.value = [];
        totalRecords.value = 0;
    } finally {
        loadingTable.value = false;
    }
};

const autoCompleteToModel = (model) => {
    if (model) {
        model.patterns = [...new Set([...autoComplete.value.patterns])];
        model.roles = [...new Set([...autoComplete.value.roles])];
    }
};

const modelToAutoComplete = (model) => {
    if (model) {
        autoComplete.value.patterns = [...new Set([...model.patterns])];
        autoComplete.value.roles = [...new Set([...model.roles])];
    }
};

const onPage = (event) => {
    initTableParam(event);
    fetchRouteRedirect();
};

const onSort = (event) => {
    initTableParam(event);
    fetchRouteRedirect();
};

const onFilter = (event) => {
    initTableParam(event);
    fetchRouteRedirect();
    isFilter.value = true;
};

const onClearFilter = () => {
    let isRefresh = false;
    isFilter.value = false;
    selectedItem.value = null;
    Object.keys(filters.value).forEach((key) => {
        const filter = filters.value[key];
        if (filter.constraints) {
            filter.constraints.forEach((v) => {
                if (!isRefresh) isRefresh = v.value != null;
                v.value = null;
            });
        } else {
            if (!isRefresh) isRefresh = filter.value != null;
            filter.value = null;
        }
    });
    if (isRefresh) fetchRouteRedirect();
};

const onRowDblClick = (event) => {
    modelRef.value = { ...event.data };
    const model = modelRef.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route security ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const resetModel = () => {
    errorMessage.value = { pattern: null };
    modelRef.value = { methods: [], roles: [], patterns: [], denyAll: false, permitAll: true, authenticated: false, type: 'BEARER', status: 'ACTIVE' };
    selectedItem.value = null;
    routeIds.value = [];
    autoComplete.value.patterns = [];
    autoComplete.value.roles = [];
};

const validationForm = (event) => {
    const id = event.id || event.target.id;
    const error = errorMessage.value;
    const patterns = autoComplete.value.patterns;
    if (id === 'patterns' || id === 'all') {
        if (!patterns || !Array.isArray(patterns) || patterns.length <= 0) {
            error.pattern = 'please enter patterns';
        } else {
            error.pattern = null;
        }
    }
};

const showDialog = () => {
    resetModel();
    selectedItem.value = null;
    dialogTitle.value = 'Add new route redirect';
    isEdit.value = false;
    displayDialog.value = true;
};

const hideDialog = () => {
    resetModel();
    displayDialog.value = false;
};

const editRouteRedirect = (param) => {
    if (param && param.id) {
        modelRef.value = { ...param };
    } else if (selectedItem.value && selectedItem.value.id) {
        modelRef.value = { ...selectedItem.value };
    }
    const model = modelRef.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route redirect ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const saveRouteRedirect = () => {
    validationForm({ id: 'all' });
    const error = errorMessage.value;
    const isValid = !error.pattern;
    if (!isValid) {
        scrollToFirstError();
        return;
    }
    const model = modelRef.value;
    autoCompleteToModel(model);
    loadingSubmit.value = true;
    if (isEdit.value) {
        routeSecurityService
            .updateRouteSecurity(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Update route security ' + model?.id, detail: res.message, life: 3000 });
                fetchRouteRedirect();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    } else {
        routeSecurityService
            .addRouteSecurity(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Add route security', detail: res.message, life: 3000 });
                fetchRouteRedirect();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    }
};

const deleteRouteRedirect = () => {
    const id = modelRef.value.id;
    routeSecurityService
        .deleteRouteSecurity(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route redirect ' + id, detail: res.message, life: 3000 });
            fetchRouteRedirect();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            modelRef.value = {};
        });
};

const deleteSelectedRouteRedirect = () => {
    const id = selectedItem.value.id;
    routeSecurityService
        .deleteRouteSecurity(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route redirect ' + id, detail: res.message, life: 3000 });
            fetchRouteRedirect();
        })
        .finally(() => {
            displayDeleteSelected.value = false;
            selectedItem.value = null;
        });
};

const onBlurAutoCompelete = (event) => {
    const inputEl = event.target;
    const id = inputEl.id;
    const value = inputEl.value.trim();
    const field = autoComplete.value[id];
    if (value && field && Array.isArray(field) && !field.includes(value)) {
        autoComplete.value[id].push(value);
        autoComplete.value[id] = [...autoComplete.value[id]];
    }
    inputEl.value = '';
    if (id === 'patterns') validationForm(event);
};

export {
    autoComplete,
    deleteRouteRedirect,
    deleteSelectedRouteRedirect,
    dialogContent,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    displayDialog,
    dropDownType,
    dt,
    editRouteRedirect,
    errorMessage,
    exportCSV,
    fetchRouteRedirect,
    filterMatchMode,
    filters,
    globalFilterFields,
    hideDialog,
    initTableParam,
    isEdit,
    isFilter,
    limit,
    list,
    loadingRouteIds,
    loadingSubmit,
    loadingTable,
    mapFilterType,
    modelRef,
    onBlurAutoCompelete,
    onClearFilter,
    onFilter,
    onPage,
    onRowDblClick,
    onSort,
    page,
    resetModel,
    routeIds,
    saveRouteRedirect,
    selectedItem,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords,
    validationForm
};
