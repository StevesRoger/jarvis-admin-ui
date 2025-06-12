import { routeService } from '@/service/routeService';
import { converter } from '@/utils/objectUtil';
import { camelToSnake, UrlUtil } from '@/utils/stringUtil';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { nextTick, ref } from 'vue';

const dt = ref(null);
const routes = ref(null);
const loadingTable = ref(false);
const page = ref(0);
const limit = ref(10);
const totalRecords = ref(0);
const mapFilterType = ref(new Map());
const tableParam = ref({});

const isFilter = ref(false);
const globalFilterFields = ref(['name', 'path', 'url', 'connectionReadTimeout', 'createdBy', 'excludeHeader', 'requiredHeader', 'whitelistIp', 'status']);
const filterNameMatchMode = ref([
    { label: 'Contains', value: FilterMatchMode.CONTAINS },
    { label: 'Starts With', value: FilterMatchMode.STARTS_WITH }
]);
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

const displayDialog = ref(false);
const dialogTitle = ref('Add route');
const isEdit = ref(false);
const dialogContent = ref(null);
const errorMessage = ref({ id: null, path: null, url: null });
const routeModel = ref({});
const selectedRoute = ref(null);
const loadingSubmit = ref(false);
const displayConfirmDelete = ref(false);
const displayDeleteSelected = ref(false);

const initTableParam = (source) => {
    if (source) {
        const param = tableParam.value;
        param.page = source.page || page.value;
        param.limit = source.rows || limit.value;
        param.filters = source.filters;
        param.sortField = source.sortField;
        param.sortOrder = source.sortOrder;
        param.multiSortMeta = source.multiSortMeta;
    } else {
        const table = dt?.value;
        tableParam.value = {
            page: table?.page || page.value,
            limit: table?.rows || limit.value,
            sortField: table?.sortField || null,
            sortOrder: table?.sortOrder || null,
            multiSortMeta: table?.multiSortMeta || null,
            filters: table?.filters || filters.value,
            globalFilterFields: table?.globalFilterFields || globalFilterFields.value
        };
    }
};

const buildQueryParam = () => {
    const filterParam = [];
    const param = tableParam.value;
    Object.entries(param.filters).forEach(([key, obj]) => {
        const conditions = obj.constraints ? obj.constraints.filter((v) => v.value != null && v.value !== '' && v.matchMode) : null;
        const value = obj.value;
        const operator = obj.operator || 'AND';
        const matchMode = obj.matchMode;
        const dataType = mapFilterType.value.get(key);
        if (value != null && value !== '' && matchMode) {
            if (key === 'global') {
                for (let field of globalFilterFields.value) {
                    let fieldType = mapFilterType.value.get(field);
                    let fieldMatchMode = fieldType === 'number' || fieldType === 'boolean' ? FilterMatchMode.EQUALS : matchMode;
                    filterParam.push({ field: field, value: converter(fieldType, value), operator: 'OR', match_mode: camelToSnake(fieldMatchMode).toUpperCase() });
                }
            } else {
                filterParam.push({ field: key, value: converter(dataType, value), operator: operator.toUpperCase(), match_mode: camelToSnake(matchMode).toUpperCase() });
            }
        } else if (conditions) {
            for (let con of conditions) {
                filterParam.push({ field: key, value: converter(dataType, con.value), operator: operator.toUpperCase(), match_mode: camelToSnake(con.matchMode).toUpperCase() });
            }
        }
    });
    const sortField = param.sortField === 'id' ? 'name' : param.sortField || null;
    const sortOrder = param.sortOrder;
    let sortDirection = null;
    if (sortOrder === 1) sortDirection = 'ASC';
    else if (sortOrder === -1) sortDirection = 'DESC';
    const queryParam = { page: param.page + 1, limit: param.limit, sort_field: sortField, sort_direction: sortDirection, filters: JSON.stringify(filterParam) };
    return queryParam;
};

const fetchRoute = async () => {
    try {
        loadingTable.value = true;
        selectedRoute.value = null;
        const res = await routeService.listRoute(buildQueryParam());
        const data = res.data;
        totalRecords.value = data.totalRecord;
        routes.value = data.item;
    } catch (error) {
        routes.value = [];
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
    let shouldRefresh = false;
    isFilter.value = false;
    selectedRoute.value = null;
    Object.keys(filters.value).forEach((key) => {
        const filter = filters.value[key];
        if (filter.constraints) {
            filter.constraints.forEach((v) => {
                if (!shouldRefresh) shouldRefresh = v.value != null;
                v.value = null;
            });
        } else {
            if (!shouldRefresh) shouldRefresh = filter.value != null;
            filter.value = null;
        }
    });
    if (shouldRefresh) fetchRoute();
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
    routeModel.value = { ...event.data };
    const model = routeModel.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const resetModel = () => {
    errorMessage.value = { id: null, path: null, url: null };
    routeModel.value = { stripPrefix: true, enableRedirect: false, status: 'ACTIVE', excludeHeader: [], requiredHeader: [], whitelistIp: [] };
    selectedRoute.value = null;
    autoComplete.value.excludeHeader = [];
    autoComplete.value.requiredHeader = [];
    autoComplete.value.whitelistIp = [];
};

const validationForm = (event) => {
    const inputId = event.id || event.target.id;
    const error = errorMessage.value;
    const model = routeModel.value;
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

const scrollToFirstError = () => {
    nextTick(() => {
        const dialogEl = dialogContent.value;
        if (!dialogEl) return;
        const firstErrorEl = document.querySelector('.p-invalid');
        if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorEl.focus();
        }
    });
};

const showDialog = () => {
    resetModel();
    selectedRoute.value = null;
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
        routeModel.value = { ...param };
    } else if (selectedRoute.value && selectedRoute.value.id) {
        routeModel.value = { ...selectedRoute.value };
    }
    const model = routeModel.value;
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
    const model = routeModel.value;
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

const showConfirmDelete = (prod) => {
    routeModel.value = prod;
    displayConfirmDelete.value = true;
};

const deleteRoute = () => {
    const id = routeModel.value.id;
    routeService
        .deleteRoute(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route ' + id, detail: res.message, life: 3000 });
            fetchRoute();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            routeModel.value = {};
        });
};

const showConfirmDeleteSelected = () => {
    displayDeleteSelected.value = true;
};

const deleteSelectedRoute = () => {
    const id = selectedRoute.value.id;
    routeService
        .deleteRoute(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route ' + id, detail: res.message, life: 3000 });
            fetchRoute();
        })
        .finally(() => {
            displayDeleteSelected.value = false;
            selectedRoute.value = null;
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
    filterNameMatchMode,
    filters,
    globalFilterFields,
    hideDialog,
    initTableParam,
    isEdit,
    isFilter,
    limit,
    loadingSubmit,
    loadingTable,
    mapFilterType,
    onBlurAutoCompelete,
    onClearFilter,
    onFilter,
    onPage,
    onRowDblClick,
    onSort,
    page,
    resetModel,
    routeModel,
    routes,
    saveRoute,
    selectedRoute,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords,
    validationForm
};
