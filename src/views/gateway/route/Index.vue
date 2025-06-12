<script setup>
import { dropDownStatuses, getStatusSeverity, statuses } from '@/utils/componentUtil';
import { onBeforeMount, onMounted, watch } from 'vue';
import {
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
} from './useRoute';

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            initTableParam(dt.value);
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
    initTableParam();
    fetchRoute();
});
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" class="mr-2" outlined :disabled="loadingTable" @click="showDialog" />
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editRoute" :disabled="loadingTable || !selectedRoute" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" outlined class="mr-2" @click="showConfirmDeleteSelected" :disabled="loadingTable || !selectedRoute" />
                    <Button label="Clear" icon="pi pi-filter-slash" outlined @click="onClearFilter" :disabled="!isFilter" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" :disabled="loadingTable" @click="exportCSV" />
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
                @row-dblclick="onRowDblClick($event)"
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
                        <h4 class="m-0" style="display: inline">Manage Route</h4>
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
                <Column field="path" filterField="path" header="Context Path" sortable :showFilterMatchModes="false" style="min-width: 14rem">
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
                        <InputText v-model="filterModel.value" type="number" placeholder="Search by read timeout" />
                    </template>
                </Column>
                <Column field="excludeHeader" filterField="excludeHeader" header="Exclude Header" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.excludeHeader.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by exclude header" />
                    </template>
                </Column>
                <Column field="requiredHeader" filterField="requiredHeader" header="Required Header" :showFilterMatchModes="false" style="min-width: 15rem">
                    <template #body="{ data }">
                        {{ data.requiredHeader.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by required header" />
                    </template>
                </Column>
                <Column field="whitelistIp" filterField="whitelistIp" header="WhitelistIp" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.whitelistIp.join(', ') }}
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
                <Column field="createdBy" filterField="createdBy" header="Created By" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.createdBy }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by created by" />
                    </template>
                </Column>
                <Column field="createdDate" filterField="createdDate" header="Created Date" :showFilterMatchModes="false" dataType="date" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.createdDate }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" />
                    </template>
                </Column>
                <Column field="updatedBy" header="Updated By" :showFilterMatchModes="false" style="min-width: 12rem" />
                <Column field="updatedDate" header="Update Date" :showFilterMatchModes="false" dataType="date" style="min-width: 14rem" />
                <Column header="Action" :exportable="false" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editRoute(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined severity="danger" @click="showConfirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="displayDialog" :style="{ width: '450px' }" :header="dialogTitle" @update:visible="resetModel" :closable="false" :draggable="false" :modal="true">
            <div ref="dialogContent" class="flex flex-col gap-6 dialog-content">
                <div>
                    <label for="id" class="block font-bold mb-3 required">ID</label>
                    <InputText id="id" v-model.trim="routeModel.id" @blur="validationForm($event)" :disabled="isEdit" placeholder="order" required="true" :invalid="errorMessage.id != null" fluid />
                    <small v-if="errorMessage.id" class="text-red-500">{{ errorMessage.id }}</small>
                </div>
                <div>
                    <label for="path" class="block font-bold mb-3 required">Path</label>
                    <InputText id="path" v-model.trim="routeModel.path" @blur="validationForm($event)" placeholder="/api/**" required="true" :invalid="errorMessage.path != null" fluid />
                    <small v-if="errorMessage.path" class="text-red-500">{{ errorMessage.path }}</small>
                </div>
                <div>
                    <label for="url" class="block font-bold mb-3 required">URL</label>
                    <InputText id="url" v-model.trim="routeModel.url" @blur="validationForm($event)" placeholder="http://localhost:8080" required="true" :invalid="errorMessage.url != null" fluid />
                    <small v-if="errorMessage.url" class="text-red-500">{{ errorMessage.url }}</small>
                </div>
                <div>
                    <label for="requiredHeader" class="block font-bold mb-3">Required Header</label>
                    <AutoComplete inputId="requiredHeader" v-model="autoComplete.requiredHeader" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                    <!-- <InputChips id="excludeHeader" v-model="routeModel.excludeHeader" separator="," fluid /> -->
                </div>
                <div>
                    <label for="excludeHeader" class="block font-bold mb-3">Exclude Header</label>
                    <AutoComplete inputId="excludeHeader" v-model="autoComplete.excludeHeader" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div>
                    <label for="whitelistIp" class="block font-bold mb-3">Whitelist IP</label>
                    <AutoComplete inputId="whitelistIp" v-model="autoComplete.whitelistIp" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="timeout" class="block font-bold mb-3">Connection timeout</label>
                        <InputText id="timeout" type="number" v-model.trim="routeModel.connectionReadTimeout" placeholder="20000" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="status" class="block font-bold mb-3">Status</label>
                        <Select id="status" v-model="routeModel.status" :options="dropDownStatuses" optionLabel="label" optionValue="value" placeholder="Select a status" fluid></Select>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Strip Prefix</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="strip-prefix-yes" v-model="routeModel.stripPrefix" name="stripPrefix" :value="true" />
                            <label for="strip-prefix-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="strip-prefix-false" v-model="routeModel.stripPrefix" name="stripPrefix" :value="false" />
                            <label for="strip-prefix-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Enable Redirect</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="enable-redirect-yes" v-model="routeModel.enableRedirect" name="enableRedirect" :value="true" />
                            <label for="enable-redirect-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="enable-redirect-false" v-model="routeModel.enableRedirect" name="enableRedirect" :value="false" />
                            <label for="enable-redirect-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div v-if="loadingSubmit" class="loading-overlay">
                    <ProgressSpinner class="small-spinner" />
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
                <span v-if="routeModel"
                    >Are you sure you want to delete <b>{{ routeModel.id }}</b
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
                <span v-if="routeModel">Are you sure you want to delete the selected route?</span>
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

.dialog-content {
    position: relative;
    min-height: 150px;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    pointer-events: all;
}

.small-spinner {
    width: 40px !important;
    height: 40px !important;
    margin: 0;
    align-self: center;
}
</style>
