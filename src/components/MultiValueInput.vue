<script setup>
const model = defineModel({ type: Array, default: () => [] });
const props = defineProps({
    keyLabel: {
        type: String,
        default: 'Key'
    },
    valuesLabel: {
        type: String,
        default: 'Values'
    },
    keyPlaceholder: {
        type: String,
        default: 'Enter key'
    },
    valuesPlaceholder: {
        type: String,
        default: 'Enter values'
    },
    addButtonLabel: {
        type: String,
        default: 'Add Entry'
    },
    keyInputId: {
        type: String,
        default: 'keyInputId'
    },
    valueInputId: {
        type: String,
        default: 'valueInputId'
    },
    title: {
        type: String,
        default: 'Multi value input'
    }
});

const addEntry = () => {
    model.value = [...model.value, { key: '', values: [] }];
};

const removeEntry = (index) => {
    model.value = model.value.filter((_, i) => i !== index);
};

const autoCompeleteChip = (event, entry) => {
    const inputEl = event.target;
    const value = inputEl.value.trim();
    if (event.type === 'blur' || (event.type === 'keydown' && event.key === 'Enter')) {
        if (value && value !== '' && !entry.values.includes(value)) {
            entry.values = [...entry.values, value];
        }
        inputEl.value = '';
    }
};
</script>

<template>
    <div>
        <span class="block font-bold mb-4">{{ title }}</span>
        <div v-for="(entry, index) in model" :key="index" :class="model.length > 0 ? 'container grid gap-4' : ''">
            <Button icon="pi pi-times" class="p-button p-button-text close-button" @click="removeEntry(index)" />
            <div class="gap-2 col-span-6">
                <label class="block font-bold mb-3">{{ keyLabel }}</label> <InputText :id="keyInputId" v-model="entry.key" :placeholder="keyPlaceholder" fluid />
            </div>
            <div class="gap-2 col-span-6">
                <label class="block font-bold mb-3">{{ valuesLabel }}</label>
                <AutoComplete :input-id="valueInputId" v-model="entry.values" :multiple="true" :typeahead="false" @blur="autoCompeleteChip($event, entry)" @keydown.enter="autoCompeleteChip($event, entry)" :placeholder="valuesPlaceholder" fluid />
            </div>
        </div>
        <Button :label="addButtonLabel" icon="pi pi-plus" outlined @click="addEntry" class="mr-2" />
    </div>
</template>

<style scoped>
.container {
    margin-bottom: 1rem;
    position: relative;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
}
.close-button {
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
    color: red;
}
</style>
