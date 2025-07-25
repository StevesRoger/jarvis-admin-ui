import { useDataTable } from '@/composables/useDataTable';
import { useDialog } from '@/composables/useDialog';
import { routeFilterService } from '@/service/routeFilterService';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { ref } from 'vue';

const globalFilterFields = ref(['id', 'blacklistIps', 'whitelistIps', 'blockPaths', 'createdBy', 'blockUserAgents', 'order', 'status']);
const { exportCSV, initTableParam, buildQueryParam, loadingTable, dt, page, limit, totalRecords, mapFilterType, filterMatchMode, isFilter, selectedItem, isEdit, loadingSubmit, list } = useDataTable({ globalFilterFields: globalFilterFields.value });
const {
    showConfirmDelete,
    showConfirmDeleteSelected,
    scrollToFirstError,
    modelToAutoComplete,
    autoCompleteToModel,
    autoCompeleteChip,
    loadingRouteIds,
    modelRef,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    dialogContent,
    displayDialog
} = useDialog();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: { value: null, matchMode: FilterMatchMode.EQUALS },
    blockUserAgents: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    blockPaths: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    whitelistIps: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    blacklistIps: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    order: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'number' },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdBy: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdDate: { value: null, matchMode: FilterMatchMode.DATE_IS, dataType: 'date' }
});

const autoComplete = ref({ blockUserAgents: [], blockPaths: [], whitelistIps: [], blacklistIps: [] });
const excludeField = ['updatedBy', 'updatedDate', 'createdBy', 'createdDate'];
const autoCompleteField = ['blockUserAgents', 'blockPaths', 'whitelistIps', 'blacklistIps'];
const formValidate = ref({ criteria: null });

const fetchRouteFilter = async (onError) => {
    try {
        loadingTable.value = true;
        selectedItem.value = null;
        const res = await routeFilterService.listRouteFilter(buildQueryParam());
        const data = res.data;
        list.value = data.item;
        totalRecords.value = data.totalRecord;
    } catch (error) {
        list.value = [];
        totalRecords.value = 0;
        if (onError) onError(error);
    } finally {
        loadingTable.value = false;
    }
};

const onPage = (event) => {
    initTableParam(event);
    fetchRouteFilter();
};

const onSort = (event) => {
    initTableParam(event);
    fetchRouteFilter();
};

const onFilter = (event) => {
    initTableParam(event);
    fetchRouteFilter();
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
    if (isRefresh) fetchRouteFilter();
};

const onRowDblClick = (event) => {
    modelRef.value = { ...event.data };
    const model = modelRef.value;
    modelToAutoComplete(model, autoComplete.value, autoCompleteField);
    dialogTitle.value = 'Edit route filter ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const resetModel = () => {
    formValidate.value = { criteria: null };
    modelRef.value = { blockUserAgents: [], blockPaths: [], whitelistIps: [], blacklistIps: [], status: 'ACTIVE', order: 1 };
    selectedItem.value = null;
    const autoCompleteValue = autoComplete.value;
    autoCompleteValue.blockUserAgents = [];
    autoCompleteValue.blockPaths = [];
    autoCompleteValue.whitelistIps = [];
    autoCompleteValue.blacklistIps = [];
};

const validationForm = () => {
    const error = formValidate.value;
    const autoCompleteValue = autoComplete.value;
    const blockUserAgents = autoCompleteValue?.blockUserAgents;
    const blockPaths = autoCompleteValue?.blockPaths;
    const whitelistIps = autoCompleteValue?.whitelistIps;
    const blacklistIps = autoCompleteValue?.blacklistIps;
    if ((Array.isArray(blockUserAgents) && blockUserAgents.length > 0) || (Array.isArray(blockPaths) && blockPaths.length > 0) || (Array.isArray(whitelistIps) && whitelistIps.length > 0) || (Array.isArray(blacklistIps) && blacklistIps.length > 0)) {
        error.criteria = null;
    } else {
        error.criteria = 'please enter one of the criteria';
    }
};

const showDialog = () => {
    resetModel();
    selectedItem.value = null;
    dialogTitle.value = 'Add new route filter';
    isEdit.value = false;
    displayDialog.value = true;
};

const hideDialog = () => {
    resetModel();
    displayDialog.value = false;
};

const editRouteFilter = (param) => {
    if (param && param.id) {
        modelRef.value = { ...param };
    } else if (selectedItem.value && selectedItem.value.id) {
        modelRef.value = { ...selectedItem.value };
    }
    const model = modelRef.value;
    modelToAutoComplete(model, autoComplete.value, autoCompleteField);
    dialogTitle.value = 'Edit route filter ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const saveRouteFilter = () => {
    validationForm();
    const error = formValidate.value;
    if (error.criteria) {
        scrollToFirstError();
        return;
    }
    const model = modelRef.value;
    autoCompleteToModel(model, autoComplete.value, autoCompleteField);
    loadingSubmit.value = true;
    if (isEdit.value) {
        routeFilterService
            .updateRouteFilter(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Update route filter ' + model?.id, detail: res.message, life: 3000 });
                fetchRouteFilter();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    } else {
        routeFilterService
            .addRouteFilter(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Add route filter', detail: res.message, life: 3000 });
                fetchRouteFilter();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    }
};

const deleteRouteFilter = () => {
    const id = modelRef.value.id;
    routeFilterService
        .deleteRouteFilter(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route filter id ' + id, detail: res.message, life: 3000 });
            fetchRouteFilter();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            modelRef.value = {};
        });
};

const deleteSelectedRouteFilter = () => {
    const id = selectedItem.value.id;
    routeFilterService
        .deleteRouteFilter(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route filter id ' + id, detail: res.message, life: 3000 });
            fetchRouteFilter();
        })
        .finally(() => {
            displayDeleteSelected.value = false;
            selectedItem.value = null;
        });
};

const onBlurAutoCompelete = (event) => {
    autoCompeleteChip(event, autoComplete.value, () => validationForm(event));
};

export {
    autoComplete,
    deleteRouteFilter,
    deleteSelectedRouteFilter,
    dialogContent,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    displayDialog,
    dt,
    editRouteFilter,
    exportCSV,
    fetchRouteFilter,
    filterMatchMode,
    filters,
    formValidate,
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
    saveRouteFilter,
    selectedItem,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords,
    validationForm
};
