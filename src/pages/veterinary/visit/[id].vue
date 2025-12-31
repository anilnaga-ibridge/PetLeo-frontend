
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { veterinaryApi } from '@/api/veterinary';
import DynamicForm from '@/components/veterinary/DynamicForm.vue';
import { usePermissionStore } from '@/stores/permissionStore';

const permissionStore = usePermissionStore();

const route = useRoute();
const router = useRouter();
const visitId = route.params.id;

const visit = ref(null);
const vitalsFields = ref([]);
const prescriptionFields = ref([]);
const activeTab = ref('vitals');

const loadData = async () => {
  try {
    const [visitRes, vitalsRes, prescriptionRes] = await Promise.all([
      veterinaryApi.getVisit(visitId),
      veterinaryApi.getFields({ entity_type: 'VITALS', clinic: 'TODO_CLINIC_ID' }), // Need clinic ID from context
      veterinaryApi.getFields({ entity_type: 'PRESCRIPTION', clinic: 'TODO_CLINIC_ID' })
    ]);
    visit.value = visitRes.data;
    vitalsFields.value = vitalsRes.data.results;
    prescriptionFields.value = prescriptionRes.data.results;
  } catch (e) {
    console.error("Failed to load visit data", e);
  }
};

const handleVitalsSubmit = async (data) => {
  try {
    await veterinaryApi.saveVitals(visitId, data);
    alert('Vitals saved!');
    loadData(); // Refresh
  } catch (e) {
    alert('Error saving vitals: ' + e.message);
  }
};

const handlePrescriptionSubmit = async (data) => {
  try {
    await veterinaryApi.createEntity({
      clinic_id: visit.value.clinic,
      entity_type: 'PRESCRIPTION',
      data: { ...data, visit_id: visitId }
    });
    alert('Prescription created!');
    loadData();
  } catch (e) {
    alert('Error creating prescription: ' + e.message);
  }
};

onMounted(() => {
  if (visitId) loadData();
});
</script>

<template>
  <div class="p-6">
    <div v-if="visit" class="mb-6">
      <h1 class="text-2xl font-bold">Visit for {{ visit.pet.id }}</h1>
      <div class="text-sm text-gray-500">Status: {{ visit.status }}</div>
    </div>

    <div class="flex border-b mb-6">
      <button
        v-if="permissionStore.hasCapability('VETERINARY', 'VETERINARY_VITALS')"
        @click="activeTab = 'vitals'"
        :class="['px-4 py-2', activeTab === 'vitals' ? 'border-b-2 border-indigo-500 font-bold' : '']"
      >
        Vitals
      </button>
      <button
        v-if="permissionStore.hasCapability('VETERINARY', 'VETERINARY_PRESCRIPTIONS')"
        @click="activeTab = 'prescription'"
        :class="['px-4 py-2', activeTab === 'prescription' ? 'border-b-2 border-indigo-500 font-bold' : '']"
      >
        Prescription
      </button>
    </div>

    <div v-if="activeTab === 'vitals'">
      <h2 class="text-xl font-semibold mb-4">Record Vitals</h2>
      <DynamicForm
        :fields="vitalsFields"
        :initial-data="visit?.vitals || {}"
        @submit="handleVitalsSubmit"
      />
    </div>

    <div v-if="activeTab === 'prescription'">
      <h2 class="text-xl font-semibold mb-4">Add Prescription</h2>
      <DynamicForm
        :fields="prescriptionFields"
        submit-label="Add Prescription"
        @submit="handlePrescriptionSubmit"
      />
    </div>
  </div>
</template>
