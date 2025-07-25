<script setup>
import { useAuthHandler } from '@/composables/useAuth';
import { dropDownStatuses, getStatusSeverity, statuses } from '@/utils/componentUtil';
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
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
} from './useCors';

const allMethods = ref(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTION']);
const filteredMethods = ref([]);
const authHandler = useAuthHandler(useRouter(), useRoute().fullPath);

let delaySearch;

watch(
    () => filters.value.global.value,
    (newValue) => {
        clearTimeout(delaySearch);
        delaySearch = setTimeout(() => {
            initTableParam(dt.value);
            if (newValue != null) {
                fetchCors();
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
    fetchCors((error) => authHandler.handleUnauthorize(error));
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
                    <Button label="Edit" icon="pi pi pi-pencil" severity="info" outlined class="mr-2" @click="editCors" :disabled="loadingTable || !selectedItem" />
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
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cors"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0" style="display: inline">Manage Cors</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <template #empty>No cors found</template>
                <template #loading>Loading cors. Please wait.</template>
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
                <Column field="urls" filterField="urls" header="Url" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        <ul style="padding-left: 1rem; margin: 0">
                            <li v-for="(item, index) in data.urls" :key="index">{{ item }}</li>
                        </ul>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by url" />
                    </template>
                </Column>
                <Column field="allowedOrigins" filterField="allowedOrigins" header="Allow origin" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.allowedOrigins.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by allow origin" />
                    </template>
                </Column>
                <Column field="allowedMethods" filterField="allowedMethods" header="Allow method" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.allowedMethods.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by allow method" />
                    </template>
                </Column>
                <Column field="allowedHeaders" filterField="allowedHeaders" header="Allow header" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.allowedHeaders.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by allow header" />
                    </template>
                </Column>
                <Column field="exposedHeaders" filterField="exposedHeaders" header="Expose header" :filterMatchModeOptions="filterMatchMode" style="min-width: 14rem">
                    <template #body="{ data }">
                        {{ data.exposedHeaders.join(', ') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by expose header" />
                    </template>
                </Column>
                <Column field="maxAge" filterField="maxAge" header="Max age" sortable :showFilterMatchModes="false" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ data.maxAge }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="number" placeholder="Search by max age" />
                    </template>
                </Column>
                <Column field="allowCredential" filterField="allowCredential" header="Allow credential" dataType="boolean" bodyClass="text-center" style="min-width: 14rem">
                    <template #body="{ data }">
                        <p v-if="data.allowCredential" style="color: #15803d">YES</p>
                        <p v-if="!data.allowCredential" style="color: #b91c1c">NO</p>
                    </template>
                    <template #filter="{ filterModel }">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="allowCredential-yes" name="allowCredential" :value="true" />
                                <label for="allowCredential-yes" style="color: #15803d">YES</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filterModel.value" inputId="allowCredential-no" name="allowCredential" :value="false" />
                                <label for="allowCredential-no" style="color: #b91c1c">NO</label>
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
                        <Button icon="pi pi-pencil" outlined severity="info" class="mr-2" @click="editCors(slotProps.data)" />
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
                    <label for="urls" class="block font-bold mb-3">Url</label>
                    <AutoComplete inputId="urls" v-model="autoComplete.urls" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" :invalid="formValidate.urls != null" fluid />
                    <small v-if="formValidate.urls" class="text-red-500">{{ formValidate.urls }}</small>
                </div>
                <div>
                    <label for="allowedOrigins" class="block font-bold mb-3">Allow origin</label>
                    <AutoComplete
                        inputId="allowedOrigins"
                        v-model="autoComplete.allowedOrigins"
                        :multiple="true"
                        :typeahead="false"
                        @blur="onBlurAutoCompelete"
                        placeholder="Type and press enter"
                        :invalid="formValidate.allowedOrigins != null"
                        fluid
                    />
                    <small v-if="formValidate.allowedOrigins" class="text-red-500">{{ formValidate.allowedOrigins }}</small>
                </div>
                <div>
                    <label for="allowedMethods" class="block font-bold mb-3">Allow method</label>
                    <AutoComplete inputId="methods" v-model="modelRef.allowedMethods" :suggestions="filteredMethods" @complete="searchMethod" dropdown multiple display="chip" placeholder="Search method" fluid />
                    <small v-if="formValidate.allowedMethods" class="text-red-500">{{ formValidate.allowedMethods }}</small>
                </div>
                <div>
                    <label for="allowedHeaders" class="block font-bold mb-3">Allowed headers</label>
                    <AutoComplete
                        inputId="allowedHeaders"
                        v-model="autoComplete.allowedHeaders"
                        :multiple="true"
                        :typeahead="false"
                        @blur="onBlurAutoCompelete"
                        placeholder="Type and press enter"
                        :invalid="formValidate.allowedHeaders != null"
                        fluid
                    />
                    <small v-if="formValidate.allowedHeaders" class="text-red-500">{{ formValidate.allowedHeaders }}</small>
                </div>
                <div>
                    <label for="exposedHeaders" class="block font-bold mb-3">Exposed headers</label>
                    <AutoComplete inputId="exposedHeaders" v-model="autoComplete.exposedHeaders" :multiple="true" :typeahead="false" @blur="onBlurAutoCompelete" placeholder="Type and press enter" fluid />
                </div>
                <div>
                    <label for="maxAge" class="block font-bold mb-3">Max age</label>
                    <InputText id="maxAge" type="number" v-model.trim="modelRef.maxAge" placeholder="3600" fluid />
                </div>
                <div>
                    <label for="status" class="block font-bold mb-3">Status</label>
                    <Select id="status" v-model="modelRef.status" :options="dropDownStatuses" optionLabel="label" optionValue="value" placeholder="Select a status" fluid />
                </div>
                <div>
                    <span class="block font-bold mb-4">Allow credential</span>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="allowCredential-yes" v-model="modelRef.allowCredential" name="allowCredential" :value="true" />
                            <label for="allowCredential-yes" style="color: #15803d">YES</label>
                        </div>
                        <div class="flex items-center gap-2 col-span-6">
                            <RadioButton id="allowCredential-false" v-model="modelRef.allowCredential" name="allowCredential" :value="false" />
                            <label for="allowCredential-false" style="color: #b91c1c">NO</label>
                        </div>
                    </div>
                </div>
                <div v-if="loadingSubmit" class="loading-overlay">
                    <ProgressSpinner class="small-spinner" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text :disabled="loadingSubmit" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" :loading="loadingSubmit" @click="saveCors" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayConfirmDelete" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="modelRef"
                    >Are you sure you want to delete cors id <b>{{ modelRef.id }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayConfirmDelete = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteCors" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayDeleteSelected" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="modelRef">Are you sure you want to delete the selected cors?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayDeleteSelected = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedCors" />
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
