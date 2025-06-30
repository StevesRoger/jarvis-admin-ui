import { useDataTable } from '@/composables/useDataTable';
import { useDialog } from '@/composables/useDialog';
import { routeRedirectService } from '@/service/routeRedirectService';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { ref } from 'vue';

const globalFilterFields = ref(['id', 'patterns', 'methods', 'order', 'createdBy', 'type', 'roles', 'status']);
const { exportCSV, initTableParam, buildQueryParam, loadingTable, dt, page, limit, totalRecords, mapFilterType, filterMatchMode, isFilter, selectedItem, isEdit, loadingSubmit, list } = useDataTable({ globalFilterFields: globalFilterFields.value });
const {
    showConfirmDelete,
    showConfirmDeleteSelected,
    scrollToFirstError,
    modelToAutoComplete,
    autoCompleteToModel,
    autoCompeleteChip,
    fetchRouteId,
    loadingRouteIds,
    routeIds,
    modelRef,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    dialogContent,
    displayDialog
} = useDialog();

const excludeField = ['updatedBy', 'updatedDate', 'createdBy', 'createdDate'];
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: { value: null, matchMode: FilterMatchMode.EQUALS },
    routeId: { value: null, matchMode: FilterMatchMode.EQUALS },
    header: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    queryParam: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    jsonBody: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ip: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    userIds: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    userRoles: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    order: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'number' },
    forbidden: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdBy: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdDate: { value: null, matchMode: FilterMatchMode.DATE_IS, dataType: 'date' }
});

const headers = ref([]);
const queryParams = ref([]);
const jsonBody = ref([]);
const autoComplete = ref({ endpoint: [], ip: [], userIds: [], userRoles: [] });
const autoCompleteField = ['endpoint', 'ip', 'userIds', 'userRoles'];
const errorMessage = ref({ routeId: null });

const fetchRouteRedirect = async () => {
    try {
        loadingTable.value = true;
        selectedItem.value = null;
        const res = await routeRedirectService.listRouteRedirect(buildQueryParam());
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

const modelToMultiValueInput = (data, input) => {
    try {
        if (data && input && Array.isArray(input)) {
            const fields = data.split(';');
            for (let field of fields) {
                const [key, value] = field.split('=');
                if (key && key !== '' && value && value !== '') {
                    input.push({ key: key, values: [...value.split(',')] });
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
};

const multiValueInputToModel = (model, input, fieldName) => {
    try {
        if (model && input && Array.isArray(input)) {
            if (input.length == 0) {
                model[fieldName] = null;
                return;
            }
            let field = '';
            for (let list of input) {
                let values = null;
                if (list['values']) {
                    values = list['values'].filter((v) => v !== '').join(',');
                    if (values && values !== '') {
                        field += list['key'] + '=' + values + ';';
                    }
                }
            }
            if (field && field !== '') {
                field = field.slice(0, -1);
                model[fieldName] = field;
            }
        }
    } catch (error) {
        console.error(error);
    }
};

const onRowDblClick = (event) => {
    fetchRouteId();
    modelRef.value = { ...event.data };
    const model = modelRef.value;
    modelToAutoComplete(model, autoComplete.value, ['endpoint', 'ip', 'userIds', 'userRoles']);
    modelToMultiValueInput(model.header, headers.value);
    modelToMultiValueInput(model.queryParam, queryParams.value);
    modelToMultiValueInput(model.jsonBody, jsonBody.value);
    dialogTitle.value = 'Edit route redirect id ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const resetModel = () => {
    errorMessage.value = { pattern: null };
    modelRef.value = { endpoint: [], ip: [], userIds: [], userRoles: [], forbidden: false, status: 'ACTIVE' };
    selectedItem.value = null;
    routeIds.value = [];
    const autoCompleteValue = autoComplete.value;
    autoCompleteValue.endpoint = [];
    autoCompleteValue.ip = [];
    autoCompleteValue.userIds = [];
    autoCompleteValue.userRoles = [];
    headers.value = [];
    queryParams.value = [];
    jsonBody.value = [];
};

const validationForm = (event) => {
    const id = event.id || event.target.id;
    const error = errorMessage.value;
    const routeId = modelRef.value.routeId;
    if (id === 'routeId' || id === 'all') {
        if (!routeId || routeId === '') {
            error.routeId = 'please select route id';
        } else {
            error.routeId = null;
        }
    }
};

const showDialog = () => {
    resetModel();
    fetchRouteId();
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
    fetchRouteId();
    if (param && param.id) {
        modelRef.value = { ...param };
    } else if (selectedItem.value && selectedItem.value.id) {
        modelRef.value = { ...selectedItem.value };
    }
    const model = modelRef.value;
    modelToAutoComplete(model, autoComplete.value, autoCompleteField);
    modelToMultiValueInput(model.header, headers.value);
    modelToMultiValueInput(model.queryParam, queryParams.value);
    modelToMultiValueInput(model.jsonBody, jsonBody.value);
    dialogTitle.value = 'Edit route redirect id ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const saveRouteRedirect = () => {
    validationForm({ id: 'all' });
    const error = errorMessage.value;
    const isValid = !error.routeId;
    if (!isValid) {
        scrollToFirstError();
        return;
    }
    const model = modelRef.value;
    autoCompleteToModel(model, autoComplete.value, autoCompleteField);
    multiValueInputToModel(model, headers.value, 'header');
    multiValueInputToModel(model, queryParams.value, 'queryParam');
    multiValueInputToModel(model, jsonBody.value, 'jsonBody');
    loadingSubmit.value = true;
    if (isEdit.value) {
        routeRedirectService
            .updateRouteRedirect(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Update route redirect id ' + model?.id, detail: res.message, life: 3000 });
                fetchRouteRedirect();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    } else {
        routeRedirectService
            .addRouteRedirect(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Add route redirect id ', detail: res.message, life: 3000 });
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
    routeRedirectService
        .deleteRouteRedirect(id)
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
    routeRedirectService
        .deleteRouteRedirect(id)
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
    autoCompeleteChip(event, autoComplete.value);
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
    dt,
    editRouteRedirect,
    errorMessage,
    exportCSV,
    fetchRouteRedirect,
    filterMatchMode,
    filters,
    globalFilterFields,
    headers,
    hideDialog,
    initTableParam,
    isEdit,
    isFilter,
    jsonBody,
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
    queryParams,
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
