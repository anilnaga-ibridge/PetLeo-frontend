<script setup>
import { ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const props = defineProps({
  visitId: {
    type: String,
    required: true,
  },
})

const store = useVeterinaryStore()
const estimates = ref([])
const loading = ref(false)

const fetchEstimates = async () => {
  loading.value = true
  try {
    estimates.value = await store.fetchEstimates(props.visitId)
  } catch (e) {
    console.error("Failed to fetch estimates:", e)
  } finally {
    loading.value = false
  }
}

const createNewEstimate = async () => {
  try {
    await store.createEstimate({
      visit: props.visitId,
      status: 'DRAFT',
      notes: 'New Treatment Plan',
    })
    await fetchEstimates()
  } catch (e) {
    console.error("Failed to create estimate:", e)
  }
}

const approveEstimate = async id => {
  try {
    await store.updateEstimateStatus(id, 'APPROVED')
    await fetchEstimates()
  } catch (e) {
    console.error("Failed to approve estimate:", e)
  }
}

const convertToInvoice = async id => {
  try {
    await store.convertToInvoice(id)
    await fetchEstimates()
    alert('Estimate converted to invoice successfully!')
  } catch (e) {
    console.error("Failed to convert to invoice:", e)
    alert('Error: ' + e.response?.data?.error || e.message)
  }
}

onMounted(fetchEstimates)

const getStatusColor = status => {
  const map = {
    'DRAFT': 'secondary',
    'SENT': 'info',
    'APPROVED': 'success',
    'REJECTED': 'error',
    'INVOICED': 'primary',
  }
  
  return map[status] || 'secondary'
}
</script>

<template>
  <VCard
    class="border mb-6"
    elevation="0"
  >
    <VCardTitle class="d-flex justify-space-between align-center px-4 py-3">
      <div class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-calculator"
          color="primary"
        />
        <span class="text-h6 font-weight-bold">Treatment Estimates</span>
      </div>
      <VBtn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="tabler-plus"
        @click="createNewEstimate"
      >
        New Estimate
      </VBtn>
    </VCardTitle>

    <VDivider />

    <VCardText class="pa-0">
      <VList
        v-if="estimates.length > 0"
        class="py-0"
      >
        <template
          v-for="(est, index) in estimates"
          :key="est.id"
        >
          <VListItem class="py-4">
            <template #prepend>
              <VAvatar
                color="primary"
                variant="tonal"
                size="40"
              >
                <VIcon icon="tabler-file-invoice" />
              </VAvatar>
            </template>

            <VListItemTitle class="font-weight-bold mb-1">
              Estimate #{{ est.id.slice(0, 8) }}
            </VListItemTitle>
            <VListItemSubtitle>
              Total: <span class="text-primary font-weight-bold">₹{{ est.total_amount }}</span>
            </VListItemSubtitle>

            <template #append>
              <div class="d-flex align-center gap-2">
                <VChip
                  :color="getStatusColor(est.status)"
                  size="x-small"
                  label
                  class="text-uppercase font-weight-bold"
                >
                  {{ est.status }}
                </VChip>
                
                <VBtn
                  v-if="est.status === 'DRAFT'"
                  color="success"
                  size="x-small"
                  variant="text"
                  @click="approveEstimate(est.id)"
                >
                  Approve
                </VBtn>
                
                <VBtn
                  v-if="est.status === 'APPROVED'"
                  color="primary"
                  size="x-small"
                  variant="flat"
                  @click="convertToInvoice(est.id)"
                >
                  Invoice
                </VBtn>
              </div>
            </template>
          </VListItem>
          <VDivider v-if="index < estimates.length - 1" />
        </template>
      </VList>
      <div
        v-else
        class="pa-8 text-center text-medium-emphasis"
      >
        <VIcon
          icon="tabler-info-circle"
          size="32"
          class="mb-2"
        />
        <p class="text-body-2">
          No estimates created for this visit.
        </p>
      </div>
    </VCardText>
  </VCard>
</template>
