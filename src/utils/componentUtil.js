import { ref } from 'vue';

const statuses = ref(['ACTIVE', 'INACTIVE']);
const dropDownStatuses = ref([
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'INACTIVE', value: 'INACTIVE' }
]);
const getStatusSeverity = (status) => {
    switch (status) {
        case 'INACTIVE':
            return 'danger';
        case 'ACTIVE':
            return 'success';
        default:
            return 'secondary';
    }
};

export { dropDownStatuses, getStatusSeverity, statuses };
