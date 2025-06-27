<script setup>
import { dropDownStatuses, getStatusSeverity, statuses } from '@/utils/componentUtil';
import { onBeforeMount, onMounted, watch } from 'vue';
import {
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
    totalRecords
} from './useRouteFilter';

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            initTableParam(dt.value);
            if (newValue != null) {
                fetchRouteFilter();
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
    fetchRouteFilter();
});
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" class="mr-2" outlined :disabled="loadingTable" @click="showDialog" />
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editRouteFilter" :disabled="loadingTable || !selectedItem" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" outlined class="mr-2" @click="showConfirmDeleteSelected" :disabled="loadingTable || !selectedItem" />
                    <Button label="Clear" icon="pi pi-filter-slash" outlined @click="onClearFilter" :disabled="!isFilter" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" :disabled="loadingTable" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedItem"
                dataKey="id"
                v-model:filters="filters"
                :value="list"
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
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} route filter"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0" style="display: inline">Manage Route Filter</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <template #empty>No route filter found</template>
                <template #loading>Loading route filter. Please wait.</template>
                <Column header="#" :exportable="false">
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>
                <Column field="id" filterField="id" header="ID" :showFilterMatchModes="false" sortable style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.id }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by id" />
                    </template>
                </Column>
                <Column field="blockPaths" filterField="blockPath" header="Block path" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(item, index) in data.blockPaths" :key="index">{{ item }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by path" />
                    </template>
                </Column>
                <Column field="blockUserAgents" filterField="blockUserAgent" header="Block user agent" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.blockUserAgents.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by user agent" />
                    </template>
                </Column>
                <Column field="whitelistIps" filterField="whitelistIp" header="WhitelistIp" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.whitelistIps.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by white list ip" />
                    </template>
                </Column>
                <Column field="blacklistIps" filterField="blacklistIp" header="Black list ip" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.blacklistIps.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by black list ip" />
                    </template>
                </Column>
                <Column field="order" filterField="order" header="Order" sortable :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.order }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="number" placeholder="Search by order" />
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
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editRouteFilter(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined severity="danger" @click="showConfirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="displayDialog" :style="{ width: '450px' }" :header="dialogTitle" @update:visible="resetModel" :closable="false" :draggable="false" :modal="true">
            <div ref="dialogContent" class="flex flex-col gap-6 dialog-content">
                <div v-if="isEdit">
                    <label for="id" class="block font-bold mb-3">ID</label>
                    <InputText id="id" v-model.trim="modelRef.id" :disabled="isEdit" fluid />
                </div>
                <div>
                    <label for="blockPaths" class="block font-bold mb-3">Block paths</label>
                    <AutoComplete inputId="blockPaths" v-model="autoComplete.blockPaths" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" :invalid="formValidate.criteria != null" fluid />
                    <small v-if="formValidate.criteria" class="text-red-500">{{ formValidate.criteria }}</small>
                </div>
                <div>
                    <label for="blockUserAgents" class="block font-bold mb-3">Block user agents</label>
                    <AutoComplete inputId="blockUserAgents" v-model="autoComplete.blockUserAgents" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" :invalid="formValidate.criteria != null" fluid />
                    <small v-if="formValidate.criteria" class="text-red-500">{{ formValidate.criteria }}</small>
                </div>
                <div>
                    <label for="whitelistIps" class="block font-bold mb-3">White list ips</label>
                    <AutoComplete inputId="whitelistIps" v-model="autoComplete.whitelistIps" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" :invalid="formValidate.criteria != null" fluid />
                    <small v-if="formValidate.criteria" class="text-red-500">{{ formValidate.criteria }}</small>
                </div>
                <div>
                    <label for="blacklistIps" class="block font-bold mb-3">Black list ips</label>
                    <AutoComplete inputId="blacklistIps" v-model="autoComplete.blacklistIps" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" :invalid="formValidate.criteria != null" fluid />
                    <small v-if="formValidate.criteria" class="text-red-500">{{ formValidate.criteria }}</small>
                </div>
                <div>
                    <label for="order" class="block font-bold mb-3">Order</label>
                    <InputText id="order" type="number" v-model.trim="modelRef.order" placeholder="1" fluid />
                </div>
                <div>
                    <label for="status" class="block font-bold mb-3">Status</label>
                    <Select id="status" v-model="modelRef.status" :options="dropDownStatuses" optionLabel="label" optionValue="value" placeholder="Select a status" fluid />
                </div>
                <div v-if="loadingSubmit" class="loading-overlay">
                    <ProgressSpinner class="small-spinner" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text :disabled="loadingSubmit" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="loadingSubmit" @click="saveRouteFilter" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayConfirmDelete" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="modelRef"
                    >Are you sure you want to delete route filter id <b>{{ modelRef.id }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayConfirmDelete = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteRouteFilter" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayDeleteSelected" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="modelRef">Are you sure you want to delete the selected route?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayDeleteSelected = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedRouteFilter" />
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
