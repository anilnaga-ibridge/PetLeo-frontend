<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import DynamicFormRenderer from '@/components/veterinary/DynamicFormRenderer.vue'

const store = useVeterinaryStore()
const currentLayout = VeterinaryLayout

const pendingOrders = ref([])
const loading = ref(false)
const selectedOrder = ref(null)
const showResultDialog = ref(false)

const fetchPending = async () => {
  loading.value = true
  try {
    // Mock data
    pendingOrders.value = [
        { id: '1', visit_id: '101', pet_name: 'Max', owner_name: 'John Doe', order_details: { test: 'Blood Count' }, order_date: '2025-12-30 10:30' }
    ]
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPending)

const openResultForm = (order) => {
  selectedOrder.value = order
  showResultDialog.value = true
}

const onResultSubmitted = () => {
  showResultDialog.value = false
  fetchPending()
}
</script>

<template>
  <component :is="currentLayout">
    <div class="lab-page">
      <h1 class="text-h3 font-weight-bold text-primary mb-6">Lab Orders</h1>

      <VCard>
        <VDataTable
          :headers="[
            { title: 'Pet', key: 'pet_name' },
            { title: 'Test', key: 'order_details.test' },
            { title: 'Ordered At', key: 'order_date' },
            { title: 'Actions', key: 'actions', sortable: false }
          ]"
          :items="pendingOrders"
          :loading="loading"
        >
          <template #item.actions="{ item }">
            <VBtn
              color="primary"
              size="small"
              prepend-icon="tabler-flask"
              @click="openResultForm(item)"
            >
              Enter Results
            </VBtn>
          </template>
        </VDataTable>
      </VCard>

      <VDialog v-model="showResultDialog" max-width="800" persistent>
        <VCard v-if="selectedOrder">
          <VCardTitle class="d-flex justify-space-between align-center">
            <span>Enter Results for {{ selectedOrder.pet_name }}</span>
            <VBtn icon="tabler-x" variant="text" @click="showResultDialog = false" />
          </VCardTitle>
          <VCardText>
            <DynamicFormRenderer
              form-code="LAB_RESULTS"
              :visit-id="selectedOrder.visit_id"
              @submitted="onResultSubmitted"
              @cancel="showResultDialog = false"
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
