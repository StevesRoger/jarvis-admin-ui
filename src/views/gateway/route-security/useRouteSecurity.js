import { routeSecurityService } from '@/service/routeSecurityService';
import { routeService } from '@/service/routeService';
import { converter } from '@/utils/objectUtil';
import { camelToSnake } from '@/utils/stringUtil';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { nextTick, ref } from 'vue';

const dt = ref(null);
const routeSecurities = ref(null);
const loadingTable = ref(false);
const page = ref(0);
const limit = ref(10);
const totalRecords = ref(0);
const mapFilterType = ref(new Map());
const tableParam = ref({});

const routeIds = ref([]);
const loadingRouteIds = ref(false);

const excludeField = ['updatedBy', 'updatedDate', 'createdBy', 'createdDate'];
const isFilter = ref(false);
const globalFilterFields = ref(['id', 'patterns', 'methods', 'order', 'createdBy', 'type', 'roles', 'status']);
const filterMatchMode = ref([
    { label: 'Contains', value: FilterMatchMode.CONTAINS },
    { label: 'Starts With', value: FilterMatchMode.STARTS_WITH }
]);
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

const displayDialog = ref(false);
const dialogTitle = ref('Add route security');
const isEdit = ref(false);
const dialogContent = ref(null);
const errorMessage = ref({ pattern: null });
const routeSecurityModel = ref({});
const selectedRouteSecurity = ref(null);
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
    const sortField = param.sortField || null;
    const sortOrder = param.sortOrder;
    let sortDirection = null;
    if (sortOrder === 1) sortDirection = 'ASC';
    else if (sortOrder === -1) sortDirection = 'DESC';
    const queryParam = { page: param.page + 1, limit: param.limit, sort_field: sortField, sort_direction: sortDirection, filters: JSON.stringify(filterParam) };
    return queryParam;
};

const fetchRouteSecurity = async () => {
    try {
        loadingTable.value = true;
        selectedRouteSecurity.value = null;
        const res = await routeSecurityService.listRouteSecurity(buildQueryParam());
        const data = res.data;
        totalRecords.value = data.totalRecord;
        routeSecurities.value = data.item;
    } catch (error) {
        routeSecurities.value = [];
        totalRecords.value = 0;
    } finally {
        loadingTable.value = false;
    }
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
    fetchRouteSecurity();
};

const onSort = (event) => {
    initTableParam(event);
    fetchRouteSecurity();
};

const onFilter = (event) => {
    initTableParam(event);
    fetchRouteSecurity();
    isFilter.value = true;
};

const onClearFilter = () => {
    let shouldRefresh = false;
    isFilter.value = false;
    selectedRouteSecurity.value = null;
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
    if (shouldRefresh) fetchRouteSecurity();
};

const onRowDblClick = (event) => {
    fetchRouteId();
    routeSecurityModel.value = { ...event.data };
    const model = routeSecurityModel.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route security ' + model?.id;
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
    errorMessage.value = { pattern: null };
    routeSecurityModel.value = { methods: [], roles: [], patterns: [], denyAll: false, permitAll: true, authenticated: false, type: 'BEARER', status: 'ACTIVE' };
    selectedRouteSecurity.value = null;
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

const scrollToFirstError = () => {
    nextTick(() => {
        const dialogEl = dialogContent.value;
        if (!dialogEl) return;
        const firstErrorEl = document.querySelector('.p-invalid');
        if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorEl.focus();
            const inputEl = firstErrorEl.querySelector('input');
            if (inputEl) {
                inputEl.focus();
            }
        }
    });
};

const showDialog = () => {
    resetModel();
    fetchRouteId();
    selectedRouteSecurity.value = null;
    dialogTitle.value = 'Add new route security';
    isEdit.value = false;
    displayDialog.value = true;
};

const hideDialog = () => {
    resetModel();
    displayDialog.value = false;
};

const editRouteSecurity = (param) => {
    fetchRouteId();
    if (param && param.id) {
        routeSecurityModel.value = { ...param };
    } else if (selectedRouteSecurity.value && selectedRouteSecurity.value.id) {
        routeSecurityModel.value = { ...selectedRouteSecurity.value };
    }
    const model = routeSecurityModel.value;
    modelToAutoComplete(model);
    dialogTitle.value = 'Edit route security ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const saveRouteSecurity = () => {
    validationForm({ id: 'all' });
    const error = errorMessage.value;
    const isValid = !error.pattern;
    if (!isValid) {
        scrollToFirstError();
        return;
    }
    const model = routeSecurityModel.value;
    autoCompleteToModel(model);
    loadingSubmit.value = true;
    if (isEdit.value) {
        routeSecurityService
            .updateRouteSecurity(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Update route security ' + model?.id, detail: res.message, life: 3000 });
                fetchRouteSecurity();
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
                fetchRouteSecurity();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    }
};

const showConfirmDelete = (prod) => {
    routeSecurityModel.value = prod;
    displayConfirmDelete.value = true;
};

const deleteRouteSecurity = () => {
    const id = routeSecurityModel.value.id;
    routeSecurityService
        .deleteRouteSecurity(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route security ' + id, detail: res.message, life: 3000 });
            fetchRouteSecurity();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            routeSecurityModel.value = {};
        });
};

const showConfirmDeleteSelected = () => {
    displayDeleteSelected.value = true;
};

const deleteSelectedRouteSecurity = () => {
    const id = selectedRouteSecurity.value.id;
    routeSecurityService
        .deleteRouteSecurity(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route security ' + id, detail: res.message, life: 3000 });
            fetchRouteSecurity();
        })
        .finally(() => {
            displayDeleteSelected.value = false;
            selectedRouteSecurity.value = null;
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
    deleteRouteSecurity,
    deleteSelectedRouteSecurity,
    dialogContent,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    displayDialog,
    dropDownType,
    dt,
    editRouteSecurity,
    errorMessage,
    exportCSV,
    fetchRouteSecurity,
    filterMatchMode,
    filters,
    globalFilterFields,
    hideDialog,
    initTableParam,
    isEdit,
    isFilter,
    limit,
    loadingRouteIds,
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
    routeIds,
    routeSecurities,
    routeSecurityModel,
    saveRouteSecurity,
    selectedRouteSecurity,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords,
    validationForm
};
