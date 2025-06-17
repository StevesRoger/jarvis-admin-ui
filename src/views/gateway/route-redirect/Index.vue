<script setup>
import { dropDownStatuses, getStatusSeverity, statuses } from '@/utils/componentUtil';
import { onBeforeMount, onMounted, watch } from 'vue';
import {
    autoComplete,
    deleteRouteRedirect,
    deleteSelectedRouteRedirect,
    dialogContent,
    dialogTitle,
    displayConfirmDelete,
    displayDeleteSelected,
    displayDialog,
    dt,
    editRouteRedirect,
    errorMessage,
    exportCSV,
    fetchRouteRedirect,
    filterMatchMode,
    filters,
    globalFilterFields,
    headers,
    hideDialog,
    initTableParam,
    isEdit,
    isFilter,
    jsonBody,
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
    queryParams,
    resetModel,
    routeIds,
    saveRouteRedirect,
    selectedItem,
    showConfirmDelete,
    showConfirmDeleteSelected,
    showDialog,
    totalRecords
} from './useRouteRedirect';

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            initTableParam(dt.value);
            if (newValue != null) {
                fetchRouteRedirect();
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
    fetchRouteRedirect();
});

const splitSemicolons = (data) => {
    return (
        data
            ?.split(';')
            .map((item) => item.trim())
            .filter((item) => item.length > 0) || []
    );
};
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" class="mr-2" outlined :disabled="loadingTable" @click="showDialog" />
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editRouteRedirect" :disabled="loadingTable || !selectedItem" />
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
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} route redirect"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0" style="display: inline">Manage Route Redirect</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <template #empty>No route redirect found</template>
                <template #loading>Loading route redirect. Please wait.</template>
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
                <Column field="endpoint" filterField="endpoint" header="Endpoint" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(pattern, index) in data.endpoint" :key="index">{{ pattern }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by endpoint" />
                    </template>
                </Column>
                <Column field="header" filterField="header" header="Header" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(header, index) in splitSemicolons(data.header)" :key="index">{{ header }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by header" />
                    </template>
                </Column>
                <Column field="queryParam" filterField="queryParam" header="Query Param" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(param, index) in splitSemicolons(data.queryParam)" :key="index">{{ param }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by query param" />
                    </template>
                </Column>
                <Column field="jsonBody" filterField="jsonBody" header="Json Body" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(body, index) in splitSemicolons(data.jsonBody)" :key="index">{{ body }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by json body" />
                    </template>
                </Column>
                <Column field="ip" filterField="ip" header="IP" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.ip.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by ip" />
                    </template>
                </Column>
                <Column field="userIds" filterField="userIds" header="User Ids" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.userIds.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by user id" />
                    </template>
                </Column>
                <Column field="userRoles" filterField="userRoles" header="User Roles" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.userRoles.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by user role" />
                    </template>
                </Column>
                <Column field="forbidden" filterField="forbidden" header="Forbidden" dataType="boolean" bodyClass="text-center" style="min-width: 12rem">
                    <template #body="{ data }">
                        <p v-if="data.forbidden" style="color: #15803d">YES</p>
                        <p v-if="!data.forbidden" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="forbidden-yes" name="forbidden" :value="true" />
                                <label for="forbidden-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="forbidden-no" name="forbidden" :value="false" />
                                <label for="forbidden-no" style="color: #b91c1c">NO</label>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="routeId" filterField="routeId" header="Route ID" sortable :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.routeId }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by route id" />
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
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editRouteRedirect(slotProps.data)" />
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
                    <label for="routeId" class="block font-bold mb-3 required">Route id</label>
                    <Select id="routeId" v-model="modelRef.routeId" :options="routeIds" :loading="loadingRouteIds" placeholder="Select a route id" :invalid="errorMessage.routeId != null" fluid></Select>
                    <small v-if="errorMessage.routeId" class="text-red-500">{{ errorMessage.routeId }}</small>
                </div>
                <div>
                    <label for="endpoint" class="block font-bold mb-3">Endpoint</label>
                    <AutoComplete inputId="endpoint" v-model="autoComplete.endpoint" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div>
                    <label for="ip" class="block font-bold mb-3">Ip</label>
                    <AutoComplete inputId="ip" v-model="autoComplete.ip" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div>
                    <label for="userIds" class="block font-bold mb-3">User Id</label>
                    <AutoComplete inputId="userIds" v-model="autoComplete.userIds" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div>
                    <label for="userRoles" class="block font-bold mb-3">User Role</label>
                    <AutoComplete inputId="userRoles" v-model="autoComplete.userRoles" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="order" class="block font-bold mb-3">Order</label>
                        <InputText id="order" type="number" v-model.trim="modelRef.order" placeholder="1" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="status" class="block font-bold mb-3">Status</label>
                        <Select id="status" v-model="modelRef.status" :options="dropDownStatuses" optionLabel="label" optionValue="value" placeholder="Select a status" fluid></Select>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Forbidden</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="forbidden-yes" v-model="modelRef.forbidden" name="forbidden" :value="true" />
                            <label for="forbidden-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="forbidden-false" v-model="modelRef.forbidden" name="forbidden" :value="false" />
                            <label for="forbidden-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div>
                    <MultiValueInput v-model="headers" title="Header" add-button-label="Add header" values-placeholder="Type and press enter"></MultiValueInput>
                </div>
                <div>
                    <MultiValueInput v-model="queryParams" title="Query parameter" add-button-label="Add parameter" values-placeholder="Type and press enter"></MultiValueInput>
                </div>
                <div>
                    <MultiValueInput v-model="jsonBody" title="Json body" add-button-label="Add json body" values-placeholder="Type and press enter"></MultiValueInput>
                </div>
                <div v-if="loadingSubmit" class="loading-overlay">
                    <ProgressSpinner class="small-spinner" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text :disabled="loadingSubmit" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="loadingSubmit" @click="saveRouteRedirect" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayConfirmDelete" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="modelRef"
                    >Are you sure you want to delete route redirect id <b>{{ modelRef.id }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayConfirmDelete = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteRouteRedirect" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayDeleteSelected" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="modelRef">Are you sure you want to delete the selected route redirect?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayDeleteSelected = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedRouteRedirect" />
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
