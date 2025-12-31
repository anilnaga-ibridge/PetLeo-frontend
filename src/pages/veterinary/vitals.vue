<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import DynamicFormRenderer from '@/components/veterinary/DynamicFormRenderer.vue'

const store = useVeterinaryStore()
const currentLayout = VeterinaryLayout

const pendingVisits = ref([])
const loading = ref(false)
const selectedVisit = ref(null)
const showVitalsDialog = ref(false)

const fetchPending = async () => {
  loading.value = true
  try {
    // Mock data for now until API is fully populated
    // pendingVisits.value = await store.fetchPendingVisits('VITALS_STAFF', 'clinic_id')
    pendingVisits.value = [
        { id: '1', pet: { name: 'Max' }, owner: { name: 'John Doe' }, status: 'CREATED', created_at: '2025-12-30 10:00' },
        { id: '2', pet: { name: 'Bella' }, owner: { name: 'Jane Smith' }, status: 'CREATED', created_at: '2025-12-30 10:15' }
    ]
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPending)

const openVitalsForm = (visit) => {
  selectedVisit.value = visit
  showVitalsDialog.value = true
}

const onVitalsSubmitted = () => {
  showVitalsDialog.value = false
  fetchPending() // Refresh list
}
</script>

<template>
  <component :is="currentLayout">
    <div class="vitals-page">
      <div class="d-flex align-center mb-6">
        <h1 class="text-h3 font-weight-bold text-primary">Pending Vitals</h1>
      </div>

      <VCard>
        <VDataTable
          :headers="[
            { title: 'Pet', key: 'pet.name' },
            { title: 'Owner', key: 'owner.name' },
            { title: 'Time', key: 'created_at' },
            { title: 'Status', key: 'status' },
            { title: 'Actions', key: 'actions', sortable: false }
          ]"
          :items="pendingVisits"
          :loading="loading"
        >
          <template #item.actions="{ item }">
            <VBtn
              color="primary"
              size="small"
              prepend-icon="tabler-heart-rate-monitor"
              @click="openVitalsForm(item)"
            >
              Record Vitals
            </VBtn>
          </template>
        </VDataTable>
      </VCard>

      <!-- Vitals Dialog -->
      <VDialog v-model="showVitalsDialog" max-width="800" persistent>
        <VCard v-if="selectedVisit">
          <VCardTitle class="d-flex justify-space-between align-center">
            <span>Record Vitals for {{ selectedVisit.pet.name }}</span>
            <VBtn icon="tabler-x" variant="text" @click="showVitalsDialog = false" />
          </VCardTitle>
          <VCardText>
            <DynamicFormRenderer
              form-code="VITALS"
              :visit-id="selectedVisit.id"
              @submitted="onVitalsSubmitted"
              @cancel="showVitalsDialog = false"
            />
          </VCardText>
        </VCard>
      </VDialog>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
