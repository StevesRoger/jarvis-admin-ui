<script setup>
import { listRoute } from '@/service/RouteService';
import { formatDate } from '@/utils/DateUtil';
import { converter } from '@/utils/ObjectUtil';
import { camelToSnake } from '@/utils/StringUtil';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onBeforeMount, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const statuses = reactive(['ACTIVE', 'INACTIVE']);

const displayDialog = ref(false);
const dialogTitle = ref('Add route');
const dt = ref(null);
const routes = ref(null);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);
const mapFilterType = ref(new Map());
const tableParam = ref({});
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

const router = useRouter();

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            manipulateTableParam(dt.value);
            console.log('global search', tableParam.value);
            if (newValue != null) fetchRoute();
        }, 500);
    }
);

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
    console.log('onPage', tableParam.value);
    fetchRoute();
}

function onSort(event) {
    manipulateTableParam(event);
    console.log('onSort', tableParam.value);
    fetchRoute();
}

function onFilter(event) {
    manipulateTableParam(event);
    console.log('onFilter', tableParam.value);
    fetchRoute();
}

function onClearFilter() {
    let shouldRefresh = false;
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

function getSeverity(status) {
    switch (status) {
        case 'INACTIVE':
            return 'danger';
        case 'ACTIVE':
            return 'success';
        default:
            return 'info';
    }
}

function showDialog() {
    //displayDialog.value = true;
    router.push('/uikit/formlayout');
}

function closeDialog() {
    displayDialog.value = false;
}

async function fetchRoute() {
    try {
        loading.value = true;
        const res = await listRoute(buildQueryParam());
        routes.value = res.item;
        totalRecords.value = res.totalRecord;
        routes.value.forEach((v) => (v.createdDate = new Date(v.createdDate)));
    } catch (e) {
        console.log(e);
        routes.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

function manipulateTableParam(source) {
    if (source) {
        const param = tableParam.value;
        param.page = source.frist || page.value;
        param.limit = source.rows || limit.value;
        param.filters = source.filters;
        param.sortField = source.sortField;
        param.sortOrder = source.sortOrder;
        param.multiSortMeta = source.multiSortMeta;
    } else {
        const table = dt?.value;
        tableParam.value = {
            page: table?.frist || page.value,
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
    const queryParam = { page: param.page, limit: param.limit, sort_field: sortField, sort_direction: sortDirection, filters: JSON.stringify(filterParam) };
    console.log('filter parameter:', filterParam);
    console.log('query parameter:', queryParam);
    return queryParam;
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center w-full">
            <div class="font-semibold text-xl">Route</div>
            <Button label="Add" icon="pi pi-plus" style="margin-bottom: 5px" @click="showDialog" />
        </div>
        <Dialog :header="dialogTitle" v-model:visible="displayDialog" :breakpoints="{ '960px': '75vw' }" :style="{ width: '30vw' }" :modal="true">
            <Fluid>
                <div class="card flex flex-col gap-4">
                    <div class="grid grid-cols-12 gap-2">
                        <label for="name3" class="flex items-center col-span-12 mb-2 md:col-span-2 md:mb-0">ID</label>
                        <div class="col-span-12 md:col-span-10">
                            <InputText id="name3" type="text" />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-2">
                        <label for="email3" class="flex items-center col-span-12 mb-2 md:col-span-2 md:mb-0">Path</label>
                        <div class="col-span-12 md:col-span-10">
                            <InputText id="email3" type="text" />
                        </div>
                    </div>
                </div>
            </Fluid>
            <template #footer>
                <Button label="Save" @click="closeDialog" />
            </template>
        </Dialog>
        <DataTable
            :value="routes"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            :first="page"
            :rows="limit"
            :totalRecords="totalRecords"
            :loading="loading"
            @filter="onFilter($event)"
            @page="onPage($event)"
            @sort="onSort($event)"
            paginator
            lazy
            rowHover
            showGridlines
            stripedRows
            removableSort
            dataKey="id"
            v-model:filters="filters"
            ref="dt"
            filterDisplay="menu"
            :globalFilterFields="globalFilterFields"
        >
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="onClearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Keyword Search" />
                    </IconField>
                </div>
            </template>
            <template #empty>No route found</template>
            <template #loading>Loading route data. Please wait.</template>
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
            <Column field="createdBy" filterField="createdBy" header="Created By" :showFilterMatchModes="false" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.createdBy }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by created by" />
                </template>
            </Column>
            <Column field="createdDate" filterField="createdDate" header="Created Date" :showFilterMatchModes="false" dataType="date" style="min-width: 15rem">
                <template #body="{ data }">
                    {{ formatDate(data.createdDate) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" />
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
            <Column field="status" filterField="status" header="Status" :showFilterMatchModes="false" style="min-width: 12rem">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="getSeverity(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="statuses" placeholder="Select One" showClear>
                        <template #option="slotProps">
                            <Tag :value="slotProps.option" :severity="getSeverity(slotProps.option)" />
                        </template>
                    </Select>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}
</style>
