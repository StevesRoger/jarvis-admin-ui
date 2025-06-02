<script setup>
import { ProductService } from '@/service/ProductService';
import { listRoute } from '@/service/RouteService';
import { formatDate } from '@/utils/DateUtil';
import { converter } from '@/utils/ObjectUtil';
import { camelToSnake } from '@/utils/StringUtil';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, reactive, ref, watch } from 'vue';

const displayDialog = ref(false);
const dialogTitle = ref('Add route');
const isEdit = ref(false);
const dt = ref(null);
const routes = ref(null);
const loading = ref(false);
const page = ref(0);
const limit = ref(10);
const totalRecords = ref(0);
const mapFilterType = ref(new Map());
const tableParam = ref({});
const statuses = reactive(['ACTIVE', 'INACTIVE']);
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
            console.log('global search', tableParam.value);
            if (newValue != null) fetchRoute();
        }, 500);
    }
);

onMounted(() => {
    ProductService.getProducts().then((data) => (products.value = data));
});

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
            return 'info';
    }
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

const toast = useToast();
const products = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const routeObj = ref({});
const selectedRoute = ref();
const submitted = ref(false);

function openNew() {
    routeObj.value = {};
    submitted.value = false;
    dialogTitle.value = 'Add new route';
    isEdit.value = false;
    displayDialog.value = true;
    selectedRoute.value = null;
}

function hideDialog() {
    productDialog.value = false;
    submitted.value = false;
}

function saveProduct() {
    submitted.value = true;

    if (routeObj?.value.name?.trim()) {
        if (routeObj.value.id) {
            routeObj.value.inventoryStatus = routeObj.value.inventoryStatus.value ? routeObj.value.inventoryStatus.value : routeObj.value.inventoryStatus;
            products.value[findIndexById(routeObj.value.id)] = routeObj.value;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
        } else {
            routeObj.value.id = createId();
            routeObj.value.code = createId();
            routeObj.value.image = 'product-placeholder.svg';
            routeObj.value.inventoryStatus = routeObj.value.inventoryStatus ? routeObj.value.inventoryStatus.value : 'INSTOCK';
            products.value.push(routeObj.value);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }

        productDialog.value = false;
        routeObj.value = {};
    }
}

function editProduct(prod) {
    console.log(prod, selectedRoute);
    isEdit.value = true;
    if (prod && prod.id) routeObj.value = { ...prod };
    else if (selectedRoute) routeObj.value = { ...selectedRoute.value };
    displayDialog.value = true;
}

function confirmDeleteProduct(prod) {
    routeObj.value = prod;
    deleteProductDialog.value = true;
}

function deleteProduct() {
    products.value = products.value.filter((val) => val.id !== routeObj.value.id);
    deleteProductDialog.value = false;
    routeObj.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
}

function findIndexById(id) {
    let index = -1;
    for (let i = 0; i < products.value.length; i++) {
        if (products.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
}

function createId() {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

function deleteSelectedProducts() {
    products.value = products.value.filter((val) => !selectedRoute.value.includes(val));
    deleteProductsDialog.value = false;
    selectedRoute.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start #body="slotProps">
                    <Button label="New" icon="pi pi-plus" outlined class="mr-2" @click="openNew" />
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editProduct" :disabled="!selectedRoute" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" outlined class="mr-2" @click="confirmDeleteSelected" :disabled="!selectedRoute" />
                    <Button label="Clear" icon="pi pi-filter-slash" severity="secondary" outlined @click="onClearFilter" />
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
                :loading="loading"
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
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editProduct(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="displayDialog" :style="{ width: '450px' }" :header="dialogTitle" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- <img v-if="product.image" :src="`https://primefaces.org/cdn/primevue/images/product/${product.image}`" :alt="product.image" class="block m-auto pb-4" /> -->
                <div>
                    <label for="id" class="block font-bold mb-3">ID</label>
                    <InputText id="id" :disabled="isEdit" v-model.trim="routeObj.id" required="true" autofocus :invalid="submitted && !routeObj.id" fluid />
                    <small v-if="submitted && !routeObj.id" class="text-red-500">ID is required.</small>
                </div>
                <div>
                    <label for="description" class="block font-bold mb-3">Description</label>
                    <Textarea id="description" v-model="routeObj.description" required="true" rows="3" cols="20" fluid />
                </div>
                <div>
                    <label for="inventoryStatus" class="block font-bold mb-3">Inventory Status</label>
                    <Select id="inventoryStatus" v-model="routeObj.inventoryStatus" :options="statuses" optionLabel="label" placeholder="Select a Status" fluid></Select>
                </div>

                <div>
                    <span class="block font-bold mb-4">Category</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category1" v-model="routeObj.category" name="category" value="Accessories" />
                            <label for="category1">Accessories</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category2" v-model="routeObj.category" name="category" value="Clothing" />
                            <label for="category2">Clothing</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category3" v-model="routeObj.category" name="category" value="Electronics" />
                            <label for="category3">Electronics</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="category4" v-model="routeObj.category" name="category" value="Fitness" />
                            <label for="category4">Fitness</label>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="price" class="block font-bold mb-3">Price</label>
                        <InputNumber id="price" v-model="routeObj.price" mode="currency" currency="USD" locale="en-US" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="quantity" class="block font-bold mb-3">Quantity</label>
                        <InputNumber id="quantity" v-model="routeObj.quantity" integeronly fluid />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="routeObj"
                    >Are you sure you want to delete <b>{{ routeObj.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="routeObj">Are you sure you want to delete the selected products?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text severity="secondary" @click="deleteProductsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text severity="danger" @click="deleteSelectedProducts" />
            </template>
        </Dialog>
    </div>
</template>
