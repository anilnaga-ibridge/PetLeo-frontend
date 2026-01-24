
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { veterinaryApi } from '@/api/veterinary'
import DynamicForm from '@/components/veterinary/DynamicForm.vue'
import { usePermissionStore } from '@/stores/permissionStore'

const permissionStore = usePermissionStore()

const route = useRoute()
const router = useRouter()
const visitId = route.params.id

const visit = ref(null)
const vitalsFields = ref([])
const prescriptionFields = ref([])
const activeTab = ref('vitals')

const loadData = async () => {
  try {
    // 1. Load Visit first to get Clinic ID
    const visitRes = await veterinaryApi.getVisit(visitId)

    visit.value = visitRes.data
    
    if (!visit.value || !visit.value.clinic) {
      console.error("Visit or Clinic ID missing")
      
      return
    }
    
    const clinicId = typeof visit.value.clinic === 'object' ? visit.value.clinic.id : visit.value.clinic

    // 2. Load Fields using Clinic ID
    const [vitalsRes, prescriptionRes] = await Promise.all([
      veterinaryApi.getFields({ entity_type: 'VITALS', clinic: clinicId }),
      veterinaryApi.getFields({ entity_type: 'PRESCRIPTION', clinic: clinicId }),
    ])

    vitalsFields.value = vitalsRes.data.results
    prescriptionFields.value = prescriptionRes.data.results
  } catch (e) {
    console.error("Failed to load visit data", e)
  }
}

const handleVitalsSubmit = async data => {
  try {
    await veterinaryApi.saveVitals(visitId, data)
    alert('Vitals saved!')
    loadData() // Refresh
  } catch (e) {
    alert('Error saving vitals: ' + e.message)
  }
}

const handlePrescriptionSubmit = async data => {
  try {
    const clinicId = typeof visit.value.clinic === 'object' ? visit.value.clinic.id : visit.value.clinic

    await veterinaryApi.createEntity({
      clinic_id: clinicId,
      entity_type: 'PRESCRIPTION',
      data: { ...data, visit_id: visitId },
    })
    alert('Prescription created!')
    loadData()
  } catch (e) {
    alert('Error creating prescription: ' + e.message)
  }
}

onMounted(() => {
  if (visitId) loadData()
})
</script>

<template>
  <div class="p-6">
    <div
      v-if="visit"
      class="mb-6"
    >
      <h1 class="text-2xl font-bold">
        Visit for {{ visit.pet.id }}
      </h1>
      <div class="text-sm text-gray-500">
        Status: {{ visit.status }}
      </div>
    </div>

    <div class="flex border-b mb-6">
      <button
        v-if="permissionStore.hasCapability('VETERINARY_VITALS')"
        class="px-4 py-2"
        :class="[activeTab === 'vitals' ? 'border-b-2 border-indigo-500 font-bold' : '']"
        @click="activeTab = 'vitals'"
      >
        Vitals
      </button>
      <button
        v-if="permissionStore.hasCapability('VETERINARY_PRESCRIPTIONS')"
        class="px-4 py-2"
        :class="[activeTab === 'prescription' ? 'border-b-2 border-indigo-500 font-bold' : '']"
        @click="activeTab = 'prescription'"
      >
        Prescription
      </button>
    </div>

    <div v-if="activeTab === 'vitals'">
      <h2 class="text-xl font-semibold mb-4">
        Record Vitals
      </h2>
      <DynamicForm
        :fields="vitalsFields"
        :initial-data="visit?.vitals || {}"
        @submit="handleVitalsSubmit"
      />
    </div>

    <div v-if="activeTab === 'prescription'">
      <h2 class="text-xl font-semibold mb-4">
        Add Prescription
      </h2>
      <DynamicForm
        :fields="prescriptionFields"
        submit-label="Add Prescription"
        @submit="handlePrescriptionSubmit"
      />
    </div>
  </div>
</template>
