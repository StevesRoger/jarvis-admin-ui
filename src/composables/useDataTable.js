import { converter } from '@/utils/objectUtil';
import { camelToSnake } from '@/utils/stringUtil';
import { FilterMatchMode } from '@primevue/core';
import { ref } from 'vue';

export const useDataTable = (option) => {
    const dt = ref(null);
    const list = ref([]);
    const loadingTable = ref(false);
    const page = ref(0);
    const limit = ref(10);
    const totalRecords = ref(0);
    const mapFilterType = ref(new Map());
    const isFilter = ref(false);
    const selectedItem = ref(null);
    const isEdit = ref(false);
    const loadingSubmit = ref(false);
    const tableParam = ref();
    const filterMatchMode = ref([
        { label: 'Contains', value: FilterMatchMode.CONTAINS },
        { label: 'Starts With', value: FilterMatchMode.STARTS_WITH }
    ]);

    const exportCSV = () => {
        dt?.value?.exportCSV();
    };

    const initTableParam = (event) => {
        if (event) {
            tableParam.value = {
                page: event.page || page.value,
                limit: event.rows || limit.value,
                filters: event.filters || option?.filters || {},
                sortField: event.sortField || null,
                sortOrder: event.sortOrder || null,
                multiSortMeta: event.multiSortMeta || null,
                globalFilterFields: event.globalFilterFields || option?.globalFilterFields || {}
            };
        } else {
            const table = dt?.value;
            tableParam.value = {
                page: table?.page || page.value,
                limit: table?.rows || limit.value,
                filters: table?.filters || option?.filters || {},
                sortField: table?.sortField || null,
                sortOrder: table?.sortOrder || null,
                multiSortMeta: table?.multiSortMeta || null,
                globalFilterFields: table?.globalFilterFields || option?.globalFilterFields || {}
            };
        }
    };

    const buildQueryParam = () => {
        const filterParam = [];
        const param = tableParam.value;
        Object.entries(param.filters).forEach(([key, obj]) => {
            const conditions = obj.constraints ? obj.constraints.filter((v) => v.value != null && v.value !== '' && v.matchMode) : null;
            const value = obj.value;
            const operator = obj.operator || 'AND';
            const matchMode = obj.matchMode;
            const dataType = mapFilterType.value.get(key);
            if (value != null && value !== '' && matchMode) {
                if (key === 'global' && param.globalFilterFields) {
                    for (let field of param.globalFilterFields) {
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
        const sortField = param?.sortField || null;
        const sortOrder = param?.sortOrder || null;
        let sortDirection = null;
        if (sortOrder === 1) sortDirection = 'ASC';
        else if (sortOrder === -1) sortDirection = 'DESC';
        return { page: param?.page + 1 || 1, limit: param?.limit || 10, sort_field: sortField, sort_direction: sortDirection, filters: JSON.stringify(filterParam) };
    };

    return { exportCSV, initTableParam, buildQueryParam, loadingTable, dt, page, selectedItem, limit, totalRecords, mapFilterType, filterMatchMode, isFilter, isEdit, loadingSubmit, list };
};
