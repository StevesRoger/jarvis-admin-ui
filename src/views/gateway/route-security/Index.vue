<script setup>
import { dropDownStatuses, getStatusSeverity, statuses } from '@/utils/componentUtil';
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import {
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
    totalRecords
} from './useRouteSecurity';

const allMethods = ref(['GET', 'POST', 'PUT', 'DELETE']);
const filteredMethods = ref([]);

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            initTableParam(dt.value);
            if (newValue != null) {
                fetchRouteSecurity();
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
    fetchRouteSecurity();
});

const searchMethod = (event) => {
    const query = event.query;
    if (!query || query.trim().length <= 0) {
        filteredMethods.value = [...allMethods.value];
    } else {
        filteredMethods.value = allMethods.value.filter((method) => method.toLowerCase().startsWith(query.trim().toLowerCase()));
    }
};
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" class="mr-2" outlined :disabled="loadingTable" @click="showDialog" />
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editRouteSecurity" :disabled="loadingTable || !selectedRouteSecurity" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" outlined class="mr-2" @click="showConfirmDeleteSelected" :disabled="loadingTable || !selectedRouteSecurity" />
                    <Button label="Clear" icon="pi pi-filter-slash" outlined @click="onClearFilter" :disabled="!isFilter" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" :disabled="loadingTable" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedRouteSecurity"
                dataKey="id"
                v-model:filters="filters"
                :value="routeSecurities"
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
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} routeSecurities"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0" style="display: inline">Manage Route Security</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <template #empty>No route security found</template>
                <template #loading>Loading route security data. Please wait.</template>
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
                <Column field="patterns" filterField="patterns" header="Pattern" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(pattern, index) in data.patterns" :key="index">{{ pattern }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by pattern" />
                    </template>
                </Column>
                <Column field="methods" filterField="methods" header="Method" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.methods.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by method" />
                    </template>
                </Column>
                <Column field="roles" filterField="roles" header="Role" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.roles.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by role" />
                    </template>
                </Column>
                <Column field="denyAll" filterField="denyAll" header="Deny" dataType="boolean" bodyClass="text-center" style="min-width: 12rem">
                    <template #body="{ data }">
                        <p v-if="data.denyAll" style="color: #15803d">YES</p>
                        <p v-if="!data.denyAll" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="denyAll-yes" name="denyAll" :value="true" />
                                <label for="denyAll-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="denyAll-no" name="denyAll" :value="false" />
                                <label for="denyAll-no" style="color: #b91c1c">NO</label>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="permitAll" filterField="permitAll" header="Permit" dataType="boolean" bodyClass="text-center" style="min-width: 12rem">
                    <template #body="{ data }">
                        <p v-if="data.permitAll" style="color: #15803d">YES</p>
                        <p v-if="!data.permitAll" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="permitAll-yes" name="permitAll" :value="true" />
                                <label for="permitAll-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="permitAll-no" name="permitAll" :value="false" />
                                <label for="permitAll-no" style="color: #b91c1c">NO</label>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="authenticated" filterField="authenticated" header="Authenticated" dataType="boolean" bodyClass="text-center" style="min-width: 12rem">
                    <template #body="{ data }">
                        <p v-if="data.authenticated" style="color: #15803d">YES</p>
                        <p v-if="!data.authenticated" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="authenticated-yes" name="authenticated" :value="true" />
                                <label for="authenticated-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="authenticated-no" name="authenticated" :value="false" />
                                <label for="authenticated-no" style="color: #b91c1c">NO</label>
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
                <Column field="type" filterField="type" header="Type" :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.type }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by type" />
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
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editRouteSecurity(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined severity="danger" @click="showConfirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="displayDialog" :style="{ width: '450px' }" :header="dialogTitle" @update:visible="resetModel" :closable="false" :draggable="false" :modal="true">
            <div ref="dialogContent" class="flex flex-col gap-6 dialog-content">
                <div v-if="isEdit">
                    <label for="id" class="block font-bold mb-3">ID</label>
                    <InputText id="id" v-model.trim="routeSecurityModel.id" :disabled="isEdit" fluid />
                </div>
                <div>
                    <label for="patterns" class="block font-bold mb-3 required">Pattern</label>
                    <AutoComplete inputId="patterns" v-model="autoComplete.patterns" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" :invalid="errorMessage.pattern != null" fluid />
                    <small v-if="errorMessage.pattern" class="text-red-500">{{ errorMessage.pattern }}</small>
                </div>
                <div>
                    <label for="methods" class="block font-bold mb-3">Method</label>
                    <AutoComplete inputId="methods" v-model="routeSecurityModel.methods" :suggestions="filteredMethods" @complete="searchMethod" dropdown multiple display="chip" placeholder="Search method" fluid />
                </div>
                <div>
                    <label for="roles" class="block font-bold mb-3">Role</label>
                    <AutoComplete inputId="roles" v-model="autoComplete.roles" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div>
                    <label for="order" class="block font-bold mb-3">Order</label>
                    <InputText id="order" type="number" v-model.trim="routeSecurityModel.order" placeholder="1" fluid />
                </div>
                <div>
                    <label for="routeId" class="block font-bold mb-3">Route id</label>
                    <Select id="routeId" v-model="routeSecurityModel.routeId" :options="routeIds" :loading="loadingRouteIds" placeholder="Select a route id" fluid></Select>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="status" class="block font-bold mb-3">Status</label>
                        <Select id="status" v-model="routeSecurityModel.status" :options="dropDownStatuses" optionLabel="label" optionValue="value" placeholder="Select a status" fluid></Select>
                    </div>
                    <div class="col-span-6">
                        <label for="type" class="block font-bold mb-3">Type</label>
                        <Select id="type" v-model="routeSecurityModel.type" :options="dropDownType" optionLabel="label" optionValue="value" placeholder="Select a type" fluid></Select>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Deny</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="denyAll-yes" v-model="routeSecurityModel.denyAll" name="denyAll" :value="true" />
                            <label for="denyAll-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="denyAll-false" v-model="routeSecurityModel.denyAll" name="denyAll" :value="false" />
                            <label for="denyAll-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Permit</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="permitAll-yes" v-model="routeSecurityModel.permitAll" name="permitAll" :value="true" />
                            <label for="permitAll-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="permitAll-false" v-model="routeSecurityModel.permitAll" name="permitAll" :value="false" />
                            <label for="permitAll-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="block font-bold mb-4">Authenticated</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="authenticated-yes" v-model="routeSecurityModel.authenticated" name="authenticated" :value="true" />
                            <label for="authenticated-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="authenticated-false" v-model="routeSecurityModel.authenticated" name="authenticated" :value="false" />
                            <label for="authenticated-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div v-if="loadingSubmit" class="loading-overlay">
                    <ProgressSpinner class="small-spinner" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text :disabled="loadingSubmit" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="loadingSubmit" @click="saveRouteSecurity" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayConfirmDelete" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="routeSecurityModel"
                    >Are you sure you want to delete <b>{{ routeSecurityModel.id }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayConfirmDelete = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteRouteSecurity" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayDeleteSelected" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="routeSecurityModel">Are you sure you want to delete the selected route?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayDeleteSelected = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedRouteSecurity" />
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
