import { useDataTable } from '@/composables/useDataTable';
import { useDialog } from '@/composables/useDialog';
import { routeService } from '@/service/routeService';
import { UrlUtil } from '@/utils/stringUtil';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { ref } from 'vue';

const globalFilterFields = ref(['name', 'path', 'url', 'connectionReadTimeout', 'createdBy', 'excludeHeader', 'requiredHeader', 'whitelistIp', 'status']);
const { exportCSV, initTableParam, buildQueryParam, loadingTable, dt, page, limit, totalRecords, mapFilterType, filterMatchMode, isFilter, selectedItem, isEdit, loadingSubmit, list } = useDataTable({ globalFilterFields: globalFilterFields.value });
const { showConfirmDelete, showConfirmDeleteSelected, scrollToFirstError, modelRef, dialogTitle, displayConfirmDelete, displayDeleteSelected, dialogContent, displayDialog } = useDialog();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    path: { value: null, matchMode: FilterMatchMode.CONTAINS },
    url: { value: null, matchMode: FilterMatchMode.CONTAINS },
    connectionReadTimeout: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'number' },
    excludeHeader: { value: null, matchMode: FilterMatchMode.CONTAINS },
    requiredHeader: { value: null, matchMode: FilterMatchMode.CONTAINS },
    whitelistIp: { value: null, matchMode: FilterMatchMode.CONTAINS },
    stripPrefix: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    enableRedirect: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdBy: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdDate: { value: null, matchMode: FilterMatchMode.DATE_IS, dataType: 'date' }
});

const excludeField = ['updatedBy', 'updatedDate', 'routeRedirects', 'routeSecurities', 'swaggerFilters', 'createdBy', 'createdDate'];
const autoComplete = ref({ requiredHeader: [], excludeHeader: [], whitelistIp: [] });
const errorMessage = ref({ id: null, path: null, url: null });

const fetchRoute = async () => {
    try {
        loadingTable.value = true;
        selectedItem.value = null;
        const res = await routeService.listRoute(buildQueryParam());
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

const onPage = (event) => {
    initTableParam(event);
    fetchRoute();
};

const onSort = (event) => {
    initTableParam(event);
    fetchRoute();
};

const onFilter = (event) => {
    initTableParam(event);
    fetchRoute();
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
    if (isRefresh) fetchRoute();
};

const autoCompleteToModel = (model) => {
    if (model) {
        model.requiredHeader = [...new Set([...autoComplete.value.requiredHeader])];
        model.excludeHeader = [...new Set([...autoComplete.value.excludeHeader])];
        model.whitelistIp = [...new Set([...autoComplete.value.whitelistIp])];
    }
};

const modelToAutoComplete = (model) => {
    if (model) {
        autoComplete.value.requiredHeader = [...new Set([...model.requiredHeader])];
        autoComplete.value.excludeHeader = [...new Set([...model.excludeHeader])];
        autoComplete.value.whitelistIp = [...new Set([...model.whitelistIp])];
    }
};

const onRowDblClick = (event) => {
    modelRef.value = { ...event.data };
    const model = modelRef.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const resetModel = () => {
    errorMessage.value = { id: null, path: null, url: null };
    modelRef.value = { stripPrefix: true, enableRedirect: false, status: 'ACTIVE', excludeHeader: [], requiredHeader: [], whitelistIp: [] };
    selectedItem.value = null;
    autoComplete.value.excludeHeader = [];
    autoComplete.value.requiredHeader = [];
    autoComplete.value.whitelistIp = [];
};

const validationForm = (event) => {
    const inputId = event.id || event.target.id;
    const error = errorMessage.value;
    const model = modelRef.value;
    const id = model?.id;
    const path = model?.path;
    const url = model?.url;
    if (inputId === 'id' || inputId === 'all') {
        if (id === '' || !id) {
            error.id = 'please enter route ID';
        } else if (id.length > 10) {
            error.id = 'length cannot be greater than 15 characters';
        } else {
            error.id = null;
        }
    }
    if (inputId === 'path' || inputId === 'all') {
        if (path === '' || !path) {
            error.path = 'please enter context path';
        } else if (path.length > 30) {
            error.path = 'length cannot be greater than 30 characters';
        } else {
            error.path = null;
        }
    }
    if (inputId === 'url' || inputId === 'all') {
        if (url === '' || !url) {
            error.url = 'please enter route URL';
        } else if (UrlUtil.isValidUrl(url)) {
            error.url = 'please enter correct route URL';
        } else {
            error.url = null;
        }
    }
};

const showDialog = () => {
    resetModel();
    selectedItem.value = null;
    dialogTitle.value = 'Add new route';
    isEdit.value = false;
    displayDialog.value = true;
};

const hideDialog = () => {
    resetModel();
    displayDialog.value = false;
};

const editRoute = (param) => {
    if (param && param.id) {
        modelRef.value = { ...param };
    } else if (selectedItem.value && selectedItem.value.id) {
        modelRef.value = { ...selectedItem.value };
    }
    const model = modelRef.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const saveRoute = () => {
    validationForm({ id: 'all' });
    const error = errorMessage.value;
    const isValid = !error.id && !error.path && !error.url;
    if (!isValid) {
        scrollToFirstError();
        return;
    }
    const model = modelRef.value;
    autoCompleteToModel(model);
    loadingSubmit.value = true;
    if (isEdit.value) {
        routeService
            .updateRoute(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Update route ' + model?.id, detail: res.message, life: 3000 });
                fetchRoute();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    } else {
        routeService
            .addRoute(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Add route', detail: res.message, life: 3000 });
                fetchRoute();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    }
};

const deleteRoute = () => {
    const id = modelRef.value.id;
    routeService
        .deleteRoute(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route ' + id, detail: res.message, life: 3000 });
            fetchRoute();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            modelRef.value = {};
        });
};

const deleteSelectedRoute = () => {
    const id = selectedItem.value.id;
    routeService
        .deleteRoute(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route ' + id, detail: res.message, life: 3000 });
            fetchRoute();
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
};

export {
    autoComplete,
    deleteRoute,
    deleteSelectedRoute,
    dialogContent,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    displayDialog,
    dt,
    editRoute,
    errorMessage,
    exportCSV,
    fetchRoute,
    filterMatchMode,
    filters,
    globalFilterFields,
    hideDialog,
    initTableParam,
    isEdit,
    isFilter,
    limit,
    list,
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
    saveRoute,
    selectedItem,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords,
    validationForm
};
