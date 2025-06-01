<script setup>
import { listRoute } from '@/service/RouteService';
import { formatDate } from '@/utils/DateUtil';
import { converter } from '@/utils/ObjectUtil';
import { camelToSnake } from '@/utils/StringUtil';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onBeforeMount, reactive, ref, watch } from 'vue';

const statuses = reactive(['ACTIVE', 'INACTIVE']);

const dt = ref(null);
const routes = ref(null);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const totalRecords = ref(0);
const mapFilterType = ref(new Map());
const refTableParams = ref({});
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

let globalSearchDelay;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(globalSearchDelay);
        globalSearchDelay = setTimeout(() => {
            console.log('watcher global search', newValue);
            console.log('object table', dt.value);
            manipulateTableParam(dt.value);
            fetchRoute();
        }, 500);
    }
);

onBeforeMount(() => {
    manipulateTableParam();
    Object.entries(filters.value).forEach(([key, obj]) => {
        const dataType = obj.dataType || 'string';
        mapFilterType.value.set(key, dataType);
    });
    fetchRoute();
});

const onPage = (event) => {
    manipulateTableParam(event);
    console.log('onPage', refTableParams.value);
    fetchRoute();
};

const onSort = (event) => {
    manipulateTableParam(event);
    console.log('onSort', refTableParams.value);
    fetchRoute();
};

const onFilter = (event) => {
    manipulateTableParam(event);
    console.log('onFilter', refTableParams.value);
    fetchRoute();
    // event.filters.global = globalFilter.value;
    //apiFetch(event, true);
};

const onClearFilter = () => {
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
};

const getSeverity = (status) => {
    switch (status) {
        case 'INACTIVE':
            return 'danger';
        case 'ACTIVE':
            return 'success';
        default:
            return 'info';
    }
};

const fetchRoute = async () => {
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
};

const manipulateTableParam = (source) => {
    if (source) {
        const tableParams = refTableParams.value;
        tableParams.page = source.frist || page.value;
        tableParams.limit = source.rows || limit.value;
        tableParams.filters = source.filters;
        tableParams.sortField = source.sortField;
        tableParams.sortOrder = source.sortOrder;
        tableParams.multiSortMeta = source.multiSortMeta;
    } else {
        const table = dt?.value;
        refTableParams.value = {
            page: table?.frist || page.value,
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
    const tableParams = refTableParams.value;
    Object.entries(tableParams.filters).forEach(([key, obj]) => {
        const conditions = obj.constraints ? obj.constraints.filter((v) => v.value != null && v.value !== '' && v.matchMode) : null;
        const value = obj.value;
        const operator = obj.operator || 'AND';
        let dataType = mapFilterType.value.get(key);
        let matchMode = obj.matchMode;
        if (value != null && value !== '' && matchMode) {
            if (key === 'global') {
                for (let field of globalFilterFields.value) {
                    dataType = mapFilterType.value.get(field);
                    matchMode = dataType === 'number' || dataType === 'boolean' ? FilterMatchMode.EQUALS : matchMode;
                    filterParam.push({ field: field, value: converter(dataType, value), operator: 'OR', match_mode: camelToSnake(matchMode).toUpperCase() });
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
    const sortField = tableParams.sortField === 'id' ? 'name' : tableParams.sortField || null;
    const sortOrder = tableParams.sortOrder;
    let sortDirection = null;
    if (sortOrder === 1) sortDirection = 'ASC';
    else if (sortOrder === -1) sortDirection = 'DESC';
    const queryParam = { page: tableParams.page, limit: tableParams.limit, sort_field: sortField, sort_direction: sortDirection, filters: JSON.stringify(filterParam) };
    console.log('filter parameter:', filterParam);
    console.log('query parameter:', queryParam);
    return queryParam;
};
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Route</div>
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
            <Column field="connectionReadTimeout" filterField="connectionReadTimeout" header="Read Timeout" :showFilterMatchModes="false" style="min-width: 12rem">
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
            <!-- <Column header="Country" filterField="country.name" style="min-width: 12rem">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <img alt="flag" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="`flag flag-${data.country.code}`" style="width: 24px" />
                        <span>{{ data.country.name }}</span>
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by country" />
                </template>
                <template #filterclear="{ filterCallback }">
                    <Button type="button" icon="pi pi-times" @click="filterCallback()" severity="secondary"></Button>
                </template>
                <template #filterapply="{ filterCallback }">
                    <Button type="button" icon="pi pi-check" @click="filterCallback()" severity="success"></Button>
                </template>
            </Column>
            <Column header="Agent" filterField="representative" :showFilterMatchModes="false" :filterMenuStyle="{ width: '14rem' }" style="min-width: 14rem">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <img :alt="data.representative.name" :src="`https://primefaces.org/cdn/primevue/images/avatar/${data.representative.image}`" style="width: 32px" />
                        <span>{{ data.representative.name }}</span>
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect v-model="filterModel.value" :options="representatives" optionLabel="name" placeholder="Any">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <img :alt="slotProps.option.name" :src="`https://primefaces.org/cdn/primevue/images/avatar/${slotProps.option.image}`" style="width: 32px" />
                                <span>{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </MultiSelect>
                </template>
            </Column>
            <Column header="Date" filterField="date" dataType="date" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                </template>
            </Column>
            <Column header="Balance" filterField="balance" dataType="numeric" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ formatCurrency(data.balance) }}
                </template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="currency" currency="USD" locale="en-US" />
                </template>
            </Column>
            <Column header="Status" field="status" :filterMenuStyle="{ width: '14rem' }" style="min-width: 12rem">
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
            <Column field="activity" header="Activity" :showFilterMatchModes="false" style="min-width: 12rem">
                <template #body="{ data }">
                    <ProgressBar :value="data.activity" :showValue="false" style="height: 6px"></ProgressBar>
                </template>
                <template #filter="{ filterModel }">
                    <Slider v-model="filterModel.value" range class="m-4"></Slider>
                    <div class="flex items-center justify-between px-2">
                        <span>{{ filterModel.value ? filterModel.value[0] : 0 }}</span>
                        <span>{{ filterModel.value ? filterModel.value[1] : 100 }}</span>
                    </div>
                </template>
            </Column>
            <Column field="verified" header="Verified" dataType="boolean" bodyClass="text-center" style="min-width: 8rem">
                <template #body="{ data }">
                    <i class="pi" :class="{ 'pi-check-circle text-green-500 ': data.verified, 'pi-times-circle text-red-500': !data.verified }"></i>
                </template>
                <template #filter="{ filterModel }">
                    <label for="verified-filter" class="font-bold"> Verified </label>
                    <Checkbox v-model="filterModel.value" :indeterminate="filterModel.value === null" binary inputId="verified-filter" />
                </template>
            </Column> -->
        </DataTable>
    </div>

    <!-- <div class="card">
        <div class="font-semibold text-xl mb-4">Frozen Columns</div>
        <ToggleButton v-model="balanceFrozen" onIcon="pi pi-lock" offIcon="pi pi-lock-open" onLabel="Balance" offLabel="Balance" />

        <DataTable :value="customers2" scrollable scrollHeight="400px" class="mt-6">
            <Column field="name" header="Name" style="min-width: 200px" frozen class="font-bold"></Column>
            <Column field="id" header="Id" style="min-width: 100px"></Column>
            <Column field="name" header="Name" style="min-width: 200px"></Column>
            <Column field="country.name" header="Country" style="min-width: 200px"></Column>
            <Column field="date" header="Date" style="min-width: 200px"></Column>
            <Column field="company" header="Company" style="min-width: 200px"></Column>
            <Column field="status" header="Status" style="min-width: 200px"></Column>
            <Column field="activity" header="Activity" style="min-width: 200px"></Column>
            <Column field="representative.name" header="Representative" style="min-width: 200px"></Column>
            <Column field="balance" header="Balance" style="min-width: 200px" alignFrozen="right" :frozen="balanceFrozen">
                <template #body="{ data }">
                    <span class="font-bold">{{ formatCurrency(data.balance) }}</span>
                </template>
            </Column>
        </DataTable>
    </div>

    <div class="card">
        <div class="font-semibold text-xl mb-4">Row Expansion</div>
        <DataTable v-model:expandedRows="expandedRows" :value="products" dataKey="id" tableStyle="min-width: 60rem">
            <template #header>
                <div class="flex flex-wrap justify-end gap-2">
                    <Button text icon="pi pi-plus" label="Expand All" @click="expandAll" />
                    <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAll" />
                </div>
            </template>
            <Column expander style="width: 5rem" />
            <Column field="name" header="Name"></Column>
            <Column header="Image">
                <template #body="slotProps">
                    <img :src="`https://primefaces.org/cdn/primevue/images/product/${slotProps.data.image}`" :alt="slotProps.data.image" class="shadow-lg" width="64" />
                </template>
            </Column>
            <Column field="price" header="Price">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.price) }}
                </template>
            </Column>
            <Column field="category" header="Category"></Column>
            <Column field="rating" header="Reviews">
                <template #body="slotProps">
                    <Rating :modelValue="slotProps.data.rating" readonly />
                </template>
            </Column>
            <Column header="Status">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.inventoryStatus" :severity="getStockSeverity(slotProps.data)" />
                </template>
            </Column>
            <template #expansion="slotProps">
                <div class="p-4">
                    <h5>Orders for {{ slotProps.data.name }}</h5>
                    <DataTable :value="slotProps.data.orders">
                        <Column field="id" header="Id" sortable></Column>
                        <Column field="customer" header="Customer" sortable></Column>
                        <Column field="date" header="Date" sortable></Column>
                        <Column field="amount" header="Amount" sortable>
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.amount) }}
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status.toLowerCase()" :severity="getOrderSeverity(slotProps.data)" />
                            </template>
                        </Column>
                        <Column headerStyle="width:4rem">
                            <template #body>
                                <Button icon="pi pi-search" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </template>
        </DataTable>
    </div>

    <div class="card">
        <div class="font-semibold text-xl mb-4">Grouping</div>
        <DataTable :value="customers3" rowGroupMode="subheader" groupRowsBy="representative.name" sortMode="single" sortField="representative.name" :sortOrder="1" scrollable scrollHeight="400px" tableStyle="min-width: 50rem">
            <template #groupheader="slotProps">
                <div class="flex items-center gap-2">
                    <img :alt="slotProps.data.representative.name" :src="`https://primefaces.org/cdn/primevue/images/avatar/${slotProps.data.representative.image}`" width="32" style="vertical-align: middle" />
                    <span>{{ slotProps.data.representative.name }}</span>
                </div>
            </template>
            <Column field="representative.name" header="Representative"></Column>
            <Column field="name" header="Name" style="min-width: 200px"></Column>
            <Column field="country" header="Country" style="min-width: 200px">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <img alt="flag" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="`flag flag-${slotProps.data.country.code}`" style="width: 24px" />
                        <span>{{ slotProps.data.country.name }}</span>
                    </div>
                </template>
            </Column>
            <Column field="company" header="Company" style="min-width: 200px"></Column>
            <Column field="status" header="Status" style="min-width: 200px">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column field="date" header="Date" style="min-width: 200px"></Column>
            <template #groupfooter="slotProps">
                <div class="flex justify-end font-bold w-full">Total Customers: {{ calculateCustomerTotal(slotProps.data.representative.name) }}</div>
            </template>
        </DataTable>
    </div> -->
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}
</style>
