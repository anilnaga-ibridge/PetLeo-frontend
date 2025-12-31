
<script setup>
import { ref, watch } from 'vue';
import DynamicField from './DynamicField.vue';

const props = defineProps({
  fields: {
    type: Array,
    required: true,
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  submitLabel: {
    type: String,
    default: 'Save',
  },
});

const emit = defineEmits(['submit']);

const formData = ref({});

// Initialize form data
watch(() => props.fields, (newFields) => {
  const data = { ...props.initialData };
  newFields.forEach(field => {
    if (data[field.key] === undefined) {
      data[field.key] = field.field_type === 'BOOLEAN' ? false : '';
    }
  });
  formData.value = data;
}, { immediate: true });

const handleSubmit = () => {
  emit('submit', formData.value);
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="fields.length === 0" class="text-gray-500 italic">
      No fields defined.
    </div>
    
    <DynamicField
      v-for="field in fields"
      :key="field.key"
      :field="field"
      v-model="formData[field.key]"
    />

    <div class="pt-4">
      <button
        type="submit"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>
