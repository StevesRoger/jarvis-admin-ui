<script setup>
import { routeAPI } from '@/service/RouteService';
import { formatDate } from '@/utils/DateUtil';
import { converter } from '@/utils/ObjectUtil';
import { camelToSnake, UrlUtil } from '@/utils/StringUtil';
import { showToast } from '@/utils/ToastService';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onBeforeMount, onMounted, ref, watch } from 'vue';

const displayDialog = ref(false);
const dialogTitle = ref('Add route');
const isEdit = ref(false);
const dt = ref(null);
const routes = ref(null);
const loadingTable = ref(false);
const loadingSubmit = ref(false);
const page = ref(0);
const limit = ref(10);
const totalRecords = ref(0);
const mapFilterType = ref(new Map());
const tableParam = ref({});

const statuses = ref(['ACTIVE', 'INACTIVE']);
const dropDownstatuses = ref([
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'INACTIVE', value: 'INACTIVE' }
]);

const errorMessage = ref({ id: null, path: null, url: null });
const routeObj = ref({});
const selectedRoute = ref();
const submitted = ref(false);
const displayConfirmDelete = ref(false);
const displayDeleteSelected = ref(false);

const isFilter = ref(false);
const globalFilterFields = ref(['name', 'path', 'url', 'connectionReadTimeout', 'createdBy', 'excludeHeader', 'requiredHeader', 'whitelistIp', 'status']);
const filterNameMatchMode = ref([
    { label: 'Contains', value: FilterMatchMode.CONTAINS },
    { label: 'Starts With', value: FilterMatchMode.STARTS_WITH }
]);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    },
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

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            manipulateTableParam(dt.value);
            if (newValue != null) {
                fetchRoute();
                isFilter.value = true;
            }
        }, 500);
    }
);

onMounted(() => {});

onBeforeMount(() => {
    Object.entries(filters.value).forEach(([key, obj]) => {
        const dataType = obj.dataType || 'string';
        mapFilterType.value.set(key, dataType);
    });
    manipulateTableParam();
    fetchRoute();
});

function onPage(event) {
    manipulateTableParam(event);
    fetchRoute();
}

function onSort(event) {
    manipulateTableParam(event);
    fetchRoute();
}

function onFilter(event) {
    manipulateTableParam(event);
    fetchRoute();
    isFilter.value = true;
}

function onClearFilter() {
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
}

function getStatusSeverity(status) {
    switch (status) {
        case 'INACTIVE':
            return 'danger';
        case 'ACTIVE':
            return 'success';
        default:
            return 'secondary';
    }
}

function manipulateTableParam(source) {
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
}

function buildQueryParam() {
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
}

async function fetchRoute() {
    try {
        loadingTable.value = true;
        const res = await routeAPI.listRoute(buildQueryParam());
        const data = res.data;
        totalRecords.value = data.totalRecord;
        routes.value = data.item.map((v) => {
            v.createdDate = new Date(v.createdDate);
            delete v.updatedBy;
            delete v.updatedDate;
            delete v.routeRedirects;
            delete v.routeSecurities;
            delete v.swaggerFilters;
            return v;
        });
    } catch (error) {
        showToast({ severity: 'error', summary: 'Error Message', detail: 'Error listing route', life: 3000 });
        routes.value = [];
        totalRecords.value = 0;
    } finally {
        loadingTable.value = false;
    }
}

function validationForm(event) {
    const inputId = event.target.id;
    const error = errorMessage.value;
    const id = routeObj?.value?.id;
    const path = routeObj?.value?.path;
    const url = routeObj?.value?.url;
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
        } else if (path.length > 15) {
            error.path = 'length cannot be greater than 15 characters';
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
}

function showDialog() {
    selectedRoute.value = null;
    errorMessage.value = { id: null, path: null, url: null };
    restRouteObject();
    submitted.value = false;
    dialogTitle.value = 'Add new route';
    isEdit.value = false;
    displayDialog.value = true;
}

function hideDialog() {
    restRouteObject();
    displayDialog.value = false;
    submitted.value = false;
}

function editRoute(prod) {
    if (prod && prod.id) {
        routeObj.value = { ...prod };
    } else if (selectedRoute && selectedRoute.value.id) {
        routeObj.value = { ...selectedRoute.value };
    }
    delete routeObj.value.createdBy;
    delete routeObj.value.createdDate;
    dialogTitle.value = 'Edit route ' + routeObj.value.id;
    displayDialog.value = true;
    isEdit.value = true;
}

function restRouteObject() {
    routeObj.value = { stripPrefix: true, enableRedirect: false, status: dropDownstatuses.value[0]?.value || 'ACTIVE' };
    selectedRoute.value = null;
}

function saveRoute() {
    submitted.value = true;
    validationForm({ target: { id: 'all' } });
    const error = errorMessage.value;
    const isValid = !error.id && !error.path && !error.url;
    if (isValid) {
        loadingSubmit.value = true;
        if (isEdit.value) {
            routeAPI
                .updateRoute(routeObj.value)
                .then((res) => {
                    showToast({ severity: 'success', summary: 'Update route', detail: res.message, life: 3000 });
                    fetchRoute();
                    displayDialog.value = false;
                    restRouteObject();
                })
                .finally(() => {
                    loadingSubmit.value = false;
                });
        } else {
            routeAPI
                .addRoute(routeObj.value)
                .then((res) => {
                    showToast({ severity: 'success', summary: 'Add route', detail: res.message, life: 3000 });
                    fetchRoute();
                    displayDialog.value = false;
                    restRouteObject();
                })
                .finally(() => {
                    loadingSubmit.value = false;
                });
        }
    }
}

function showConfirmDelete(prod) {
    routeObj.value = prod;
    displayConfirmDelete.value = true;
}

function deleteRoute() {
    const id = routeObj.value.id;
    routeAPI
        .deleteRoute(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route ' + id, detail: res.message, life: 3000 });
            fetchRoute();
        })
        .finally(() => {
            displayConfirmDelete.value = false;
            routeObj.value = {};
        });
}

function showConfirmDeleteSelected() {
    displayDeleteSelected.value = true;
}

function deleteSelectedRoute() {
    const id = selectedRoute.value.id;
    routeAPI
        .deleteRoute(id)
        .then((res) => {
            showToast({ severity: 'success', summary: 'Delete route ' + id, detail: res.message, life: 3000 });
            fetchRoute();
        })
        .finally(() => {
            displayDeleteSelected.value = false;
            selectedRoute.value = null;
        });
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start #body="slotProps">
                    <Button label="New" icon="pi pi-plus" class="mr-2" outlined @click="showDialog" />
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editRoute" :disabled="!selectedRoute" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" outlined class="mr-2" @click="showConfirmDeleteSelected" :disabled="!selectedRoute" />
                    <Button label="Clear" icon="pi pi-filter-slash" severity="secondary" outlined @click="onClearFilter" :disabled="!isFilter" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedRoute"
                dataKey="id"
                v-model:filters="filters"
                :value="routes"
                :first="page"
                :rows="limit"
                :totalRecords="totalRecords"
                :loading="loadingTable"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                :globalFilterFields="globalFilterFields"
                @filter="onFilter($event)"
                @page="onPage($event)"
                @sort="onSort($event)"
                selectionMode="single"
                filterDisplay="menu"
                paginator
                lazy
                rowHover
                removableSort
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} routes"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0" style="display: inline">Manage Routes</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <template #empty>No route found</template>
                <template #loading>Loading route data. Please wait.</template>
                <Column header="#" :exportable="false">
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="id" filterField="name" header="ID" :filterMatchModeOptions="filterNameMatchMode" sortable style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.id }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by id" />
                    </template>
                </Column>
                <Column field="path" filterField="path" header="Path" sortable :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.path }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by path" />
                    </template>
                </Column>
                <Column field="url" filterField="url" header="URL" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.url }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by url" />
                    </template>
                </Column>
                <Column field="connectionReadTimeout" filterField="connectionReadTimeout" header="Read Timeout" sortable :showFilterMatchModes="false" style="min-width: 13rem">
                    <template #body="{ data }">
                        {{ data.connectionReadTimeout }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by read timeout" />
                    </template>
                </Column>
                <Column field="excludeHeader" filterField="excludeHeader" header="Exclude Header" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.excludeHeader }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by exclude header" />
                    </template>
                </Column>
                <Column field="requiredHeader" filterField="requiredHeader" header="Required Header" :showFilterMatchModes="false" style="min-width: 15rem">
                    <template #body="{ data }">
                        {{ data.requiredHeader }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by required header" />
                    </template>
                </Column>
                <Column field="whitelistIp" filterField="whitelistIp" header="WhitelistIp" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.whitelistIp }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by white list Ip" />
                    </template>
                </Column>
                <Column field="stripPrefix" filterField="stripPrefix" header="Strip Prefix" dataType="boolean" bodyClass="text-center" style="min-width: 12rem">
                    <template #body="{ data }">
                        <p v-if="data.stripPrefix" style="color: #15803d">YES</p>
                        <p v-if="!data.stripPrefix" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="strip-prefix-yes" name="stripPrefix" :value="true" />
                                <label for="strip-prefix-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="strip-prefix-no" name="stripPrefix" :value="false" />
                                <label for="strip-prefix-no" style="color: #b91c1c">NO</label>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="enableRedirect" filterField="enableRedirect" header="Enable Redirect" dataType="boolean" bodyClass="text-center" style="min-width: 12rem">
                    <template #body="{ data }">
                        <p v-if="data.enableRedirect" style="color: #15803d">YES</p>
                        <p v-if="!data.enableRedirect" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="enable-redirect-yes" name="enableRedirect" :value="true" />
                                <label for="enable-redirect-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="enable-redirect-no" name="enableRedirect" :value="false" />
                                <label for="enable-redirect-no" style="color: #b91c1c">NO</label>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="status" filterField="status" header="Status" :showFilterMatchModes="false" style="min-width: 8rem">
                    <template #body="{ data }">
                        <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                    </template>
                    <template #filter="{ filterModel }">
                        <Select v-model="filterModel.value" :options="statuses" placeholder="Select One" showClear>
                            <template #option="slotProps">
                                <Tag :value="slotProps.option" :severity="getStatusSeverity(slotProps.option)" />
                            </template>
                        </Select>
                    </template>
                </Column>
                <Column field="createdDate" filterField="createdDate" header="Created Date" :showFilterMatchModes="false" dataType="date" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.createdDate) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" />
                    </template>
                </Column>
                <Column field="createdBy" filterField="createdBy" header="Created By" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.createdBy }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by created by" />
                    </template>
                </Column>
                <Column header="Action" :exportable="false" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editRoute(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined severity="danger" @click="showConfirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="displayDialog" :style="{ width: '450px' }" :header="dialogTitle" closeOnEscape :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="id" class="block font-bold mb-3 required">ID</label>
                    <InputText id="id" v-model.trim="routeObj.id" @blur="validationForm($event)" :disabled="isEdit" placeholder="order" required="true" :invalid="submitted && !routeObj.id" fluid />
                    <small v-if="errorMessage.id" class="text-red-500">{{ errorMessage.id }}</small>
                </div>
                <div>
                    <label for="path" class="block font-bold mb-3 required">Path</label>
                    <InputText id="path" v-model.trim="routeObj.path" @blur="validationForm($event)" placeholder="/api/**" required="true" :invalid="submitted && !routeObj.path" fluid />
                    <small v-if="errorMessage.path" class="text-red-500">{{ errorMessage.path }}</small>
                </div>
                <div>
                    <label for="url" class="block font-bold mb-3 required">URL</label>
                    <InputText id="url" v-model.trim="routeObj.url" @blur="validationForm($event)" placeholder="http://localhost:8080" required="true" :invalid="submitted && (!routeObj.url || UrlUtil.isValidUrl(routeObj.url))" fluid />
                    <small v-if="errorMessage.url" class="text-red-500">{{ errorMessage.url }}</small>
                </div>
                <div>
                    <label for="required-header" class="block font-bold mb-3">Required Header</label>
                    <InputText id="required-header" v-model.trim="routeObj.requiredHeader" placeholder="x-api-token,x-auth" fluid />
                </div>
                <div>
                    <label for="exclude-header" class="block font-bold mb-3">Exclude Header</label>
                    <InputText id="exclude-header" v-model.trim="routeObj.excludeHeader" placeholder="cookie,authorization" fluid />
                </div>
                <div>
                    <label for="whitelist-ip" class="block font-bold mb-3">Whitelist Ip</label>
                    <InputText id="whitelist-ip" v-model.trim="routeObj.whitelistIp" placeholder="192.168.100.10,100.168.10.1" fluid />
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="timeout" class="block font-bold mb-3">Connection timeout</label>
                        <InputText id="timeout" type="number" v-model.trim="routeObj.connectionReadTimeout" placeholder="20000" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="status" class="block font-bold mb-3">Status</label>
                        <Select id="status" v-model="routeObj.status" :options="dropDownstatuses" optionLabel="label" optionValue="value" placeholder="Select a Status" fluid></Select>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Strip Prefix</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="strip-prefix-yes" v-model="routeObj.stripPrefix" name="stripPrefix" :value="true" />
                            <label for="strip-prefix-yes">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="strip-prefix-false" v-model="routeObj.stripPrefix" name="stripPrefix" :value="false" />
                            <label for="strip-prefix-false">NO</label>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Enable Redirect</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="enable-redirect-yes" v-model="routeObj.enableRedirect" name="enableRedirect" :value="true" />
                            <label for="enable-redirect-yes">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="enable-redirect-false" v-model="routeObj.enableRedirect" name="enableRedirect" :value="false" />
                            <label for="enable-redirect-false">NO</label>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text :disabled="loadingSubmit" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="loadingSubmit" @click="saveRoute" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayConfirmDelete" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="routeObj"
                    >Are you sure you want to delete <b>{{ routeObj.id }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayConfirmDelete = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteRoute" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayDeleteSelected" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="routeObj">Are you sure you want to delete the selected products?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayDeleteSelected = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedRoute" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped lang="scss">
.required::after {
    content: ' *';
    color: red;
}
</style>
