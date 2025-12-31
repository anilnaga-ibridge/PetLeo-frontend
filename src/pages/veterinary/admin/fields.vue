
<script setup>
import { ref, onMounted } from 'vue';
import { veterinaryApi } from '@/api/veterinary';

const fields = ref([]);
const clinics = ref([]);
const selectedClinic = ref('');
const newField = ref({
  entity_type: 'VITALS',
  key: '',
  label: '',
  field_type: 'TEXT',
  is_required: false,
  options: [] // TODO: Handle options UI
});

const entityTypes = ['CLINIC', 'OWNER', 'PET', 'VISIT', 'VITALS', 'DIAGNOSIS', 'LAB', 'PRESCRIPTION', 'VACCINE'];
const fieldTypes = ['TEXT', 'NUMBER', 'TEXTAREA', 'DATE', 'BOOLEAN', 'DROPDOWN', 'MULTISELECT'];

const loadFields = async () => {
  if (!selectedClinic.value) return;
  const res = await veterinaryApi.getFields({ clinic: selectedClinic.value });
  fields.value = res.data.results;
};

const loadClinics = async () => {
  const res = await veterinaryApi.getClinics();
  clinics.value = res.data.results;
  if (clinics.value.length > 0) {
    selectedClinic.value = clinics.value[0].id;
    loadFields();
  }
};

const createField = async () => {
  try {
    await veterinaryApi.createField({
      ...newField.value,
      clinic: selectedClinic.value
    });
    alert('Field created!');
    loadFields();
    // Reset form
    newField.value.key = '';
    newField.value.label = '';
  } catch (e) {
    alert('Error: ' + e.message);
  }
};

onMounted(() => {
  loadClinics();
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Dynamic Field Manager</h1>

    <div class="mb-6">
      <label class="block text-sm font-medium">Select Clinic</label>
      <select v-model="selectedClinic" @change="loadFields" class="border p-2 rounded w-full max-w-xs">
        <option v-for="c in clinics" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Create Form -->
      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-lg font-semibold mb-4">Add New Field</h2>
        <form @submit.prevent="createField" class="space-y-4">
          <div>
            <label>Entity Type</label>
            <select v-model="newField.entity_type" class="border p-2 w-full rounded">
              <option v-for="t in entityTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label>Field Type</label>
            <select v-model="newField.field_type" class="border p-2 w-full rounded">
              <option v-for="t in fieldTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label>Key (Machine Name)</label>
            <input v-model="newField.key" type="text" class="border p-2 w-full rounded" required />
          </div>
          <div>
            <label>Label (Display Name)</label>
            <input v-model="newField.label" type="text" class="border p-2 w-full rounded" required />
          </div>
          <div class="flex items-center">
            <input v-model="newField.is_required" type="checkbox" class="mr-2" />
            <label>Required</label>
          </div>
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Create Field</button>
        </form>
      </div>

      <!-- List -->
      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-lg font-semibold mb-4">Existing Fields</h2>
        <ul>
          <li v-for="field in fields" :key="field.id" class="border-b py-2">
            <span class="font-bold">{{ field.label }}</span> ({{ field.key }})
            <span class="text-xs bg-gray-200 px-2 py-1 rounded ml-2">{{ field.entity_type }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
