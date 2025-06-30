import { useDataTable } from '@/composables/useDataTable';
import { useDialog } from '@/composables/useDialog';
import { corsService } from '@/service/corsService';
import { showToast } from '@/utils/toastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { ref } from 'vue';

const globalFilterFields = ref(['id', 'urls', 'allowedOrigins', 'allowedMethods', 'allowedHeaders', 'exposedHeaders', 'maxAge', 'status']);
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
    urls: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    allowedOrigins: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    allowedMethods: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    allowedHeaders: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    exposedHeaders: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    maxAge: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'number' },
    allowCredential: { value: null, matchMode: FilterMatchMode.EQUALS, dataType: 'boolean' },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    createdBy: { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdDate: { value: null, matchMode: FilterMatchMode.DATE_IS, dataType: 'date' }
});

const autoComplete = ref({ urls: [], allowedOrigins: [], allowedHeaders: [], exposedHeaders: [] });
const excludeField = ['updatedBy', 'updatedDate', 'createdBy', 'createdDate'];
const autoCompleteField = ['urls', 'allowedOrigins', 'allowedHeaders', 'exposedHeaders'];
const formValidate = ref({ urls: null, allowedOrigins: null, allowedMethods: null, allowedHeaders: null });

const fetchCors = async () => {
    try {
        loadingTable.value = true;
        selectedItem.value = null;
        const res = await corsService.listCors(buildQueryParam());
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
    fetchCors();
};

const onSort = (event) => {
    initTableParam(event);
    fetchCors();
};

const onFilter = (event) => {
    initTableParam(event);
    fetchCors();
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
    if (isRefresh) fetchCors();
};

const onRowDblClick = (event) => {
    modelRef.value = { ...event.data };
    const model = modelRef.value;
    modelToAutoComplete(model, autoComplete.value, autoCompleteField);
    dialogTitle.value = 'Edit cors ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const resetModel = () => {
    formValidate.value = { urls: null, allowedOrigins: null, allowedMethods: null, allowedHeaders: null };
    modelRef.value = { urls: [], allowedOrigins: [], allowedMethods: [], allowedHeaders: [], exposedHeaders: [], allowCredential: false, maxAge: 3600, status: 'ACTIVE' };
    selectedItem.value = null;
    const autoCompleteValue = autoComplete.value;
    autoCompleteValue.urls = [];
    autoCompleteValue.allowedOrigins = [];
    autoCompleteValue.allowedHeaders = [];
    autoCompleteValue.exposedHeaders = [];
};

const validationForm = () => {
    const error = formValidate.value;
    const autoCompleteValue = autoComplete.value;
    const urls = autoCompleteValue?.urls;
    const allowedOrigins = autoCompleteValue?.allowedOrigins;
    const allowedMethods = modelRef.value?.allowedMethods;
    const allowedHeaders = autoCompleteValue?.allowedHeaders;
    if (!Array.isArray(urls) || urls.length <= 0) error.urls = 'please enter url';
    else error.urls = null;
    if (!Array.isArray(allowedOrigins) || allowedOrigins.length <= 0) error.allowedOrigins = 'please enter allow origin';
    else error.allowedOrigins = null;
    if (!Array.isArray(allowedMethods) || allowedMethods.length <= 0) error.allowedMethods = 'please enter allow method';
    else error.allowedMethods = null;
    if (!Array.isArray(allowedHeaders) || allowedHeaders.length <= 0) error.allowedHeaders = 'please enter allow header';
    else error.allowedHeaders = null;
};

const showDialog = () => {
    resetModel();
    selectedItem.value = null;
    dialogTitle.value = 'Add new cors';
    isEdit.value = false;
    displayDialog.value = true;
};

const hideDialog = () => {
    resetModel();
    displayDialog.value = false;
};

const editCors = (param) => {
    if (param && param.id) {
        modelRef.value = { ...param };
    } else if (selectedItem.value && selectedItem.value.id) {
        modelRef.value = { ...selectedItem.value };
    }
    const model = modelRef.value;
    modelToAutoComplete(model, autoComplete.value, autoCompleteField);
    dialogTitle.value = 'Edit cors ' + model?.id;
    displayDialog.value = true;
    isEdit.value = true;
    for (let field of excludeField) {
        delete model[field];
    }
};

const saveCors = () => {
    validationForm();
    const error = formValidate.value;
    if (error.urls || error.allowedOrigins || error.allowedMethods || error.allowedHeaders) {
        scrollToFirstError();
        return;
    }
    const model = modelRef.value;
    autoCompleteToModel(model, autoComplete.value, autoCompleteField);
    loadingSubmit.value = true;
    if (isEdit.value) {
        corsService
            .updateCors(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Update cors ' + model?.id, detail: res.message, life: 3000 });
                fetchCors();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    } else {
        corsService
            .addCors(model)
            .then((res) => {
                showToast({ severity: 'success', summary: 'Add cors', detail: res.message, life: 3000 });
                fetchCors();
                displayDialog.value = false;
                resetModel();
            })
            .finally(() => {
                loadingSubmit.value = false;
            });
    }
};

const deleteCors = () => {
    const id = modelRef.value.id;
    corsService
        .deleteCors(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete cors id ' + id, detail: res.message, life: 3000 });
            fetchCors();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            modelRef.value = {};
        });
};

const deleteSelectedCors = () => {
    const id = selectedItem.value.id;
    corsService
        .deleteCors(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete cors id ' + id, detail: res.message, life: 3000 });
            fetchCors();
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
    deleteCors,
    deleteSelectedCors,
    dialogContent,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    displayDialog,
    dt,
    editCors,
    exportCSV,
    fetchCors,
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
    saveCors,
    selectedItem,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords
};
