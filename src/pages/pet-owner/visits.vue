<script setup>
import { ref, onMounted } from 'vue'
import PetOwnerLayout from '@/layouts/PetOwnerLayout.vue'
import axios from 'axios'

const visits = ref([])
const loading = ref(true)
const payingId = ref(null)
const successMessage = ref('')

const fetchVisits = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://127.0.0.1:8001/api/pet-owner/visits/')
    visits.value = res.data
  } catch (err) {
    console.error('Failed to fetch visits', err)
  } finally {
    loading.value = false
  }
}

const payInvoice = async (invoiceId) => {
  payingId.value = invoiceId
  try {
    await axios.post(`http://127.0.0.1:8001/api/pet-owner/pay/${invoiceId}/`)
    successMessage.value = 'Payment successful! Thank you.'
    fetchVisits()
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('Payment failed', err)
  } finally {
    payingId.value = null
  }
}

onMounted(fetchVisits)
</script>

<template>
  <PetOwnerLayout>
    <div class="visits-container">
      <h1 class="text-h4 font-weight-bold mb-6">Visit History</h1>

      <VSnackbar v-model="successMessage" color="success" location="top">
        {{ successMessage }}
      </VSnackbar>

      <div v-if="loading" class="d-flex justify-center py-12">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <div v-else-if="visits.length === 0" class="text-center py-12 bg-white rounded-xl border border-dashed">
        <VIcon icon="tabler-history" size="64" color="medium-emphasis" class="mb-4" />
        <h2 class="text-h5 font-weight-bold mb-2">No Visits Yet</h2>
        <p class="text-medium-emphasis">Your pet's visit history will appear here.</p>
      </div>

      <div v-else>
        <VCard
          v-for="visit in visits"
          :key="visit.id"
          class="mb-4 rounded-xl elevation-2 overflow-hidden"
        >
          <VExpansionPanels variant="accordion">
            <VExpansionPanel class="rounded-xl">
              <VExpansionPanelTitle class="pa-4">
                <div class="d-flex align-center gap-4 w-100">
                  <VAvatar color="primary" variant="tonal" size="48">
                    <VIcon icon="tabler-calendar-event" />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="text-h6 font-weight-bold">{{ visit.pet_name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ new Date(visit.created_at).toLocaleDateString() }} • {{ visit.status }}
                    </div>
                  </div>
                  <div v-if="visit.invoice" class="text-right me-4">
                    <div class="text-subtitle-1 font-weight-bold text-primary">₹{{ visit.invoice.total }}</div>
                    <VChip
                      size="x-small"
                      :color="visit.invoice.status === 'PAID' ? 'success' : 'warning'"
                      variant="tonal"
                      class="text-uppercase"
                    >
                      {{ visit.invoice.status }}
                    </VChip>
                  </div>
                </div>
              </VExpansionPanelTitle>
              
              <VExpansionPanelText class="pa-4 bg-grey-50">
                <!-- Medical Summary -->
                <div class="mb-4">
                  <div class="text-subtitle-2 font-weight-bold text-uppercase text-primary mb-2">Medical Summary</div>
                  <div class="bg-white pa-4 rounded-lg border">
                    <div v-if="visit.vitals" class="mb-4">
                      <div class="text-caption font-weight-bold mb-1">Vitals</div>
                      <div class="d-flex flex-wrap gap-4">
                        <div v-for="(val, key) in visit.vitals" :key="key">
                          <span class="text-caption text-medium-emphasis">{{ key }}:</span>
                          <span class="text-body-2 font-weight-bold ms-1">{{ val }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="visit.prescriptions && visit.prescriptions.length > 0">
                      <div class="text-caption font-weight-bold mb-1">Prescriptions</div>
                      <VChipGroup>
                        <VChip v-for="p in visit.prescriptions" :key="p.id" size="small" variant="outlined">
                          {{ p.medicine_name }}
                        </VChip>
                      </VChipGroup>
                    </div>
                  </div>
                </div>

                <!-- Invoice Details -->
                <div v-if="visit.invoice">
                  <div class="text-subtitle-2 font-weight-bold text-uppercase text-primary mb-2">Invoice Details</div>
                  <div class="bg-white pa-4 rounded-lg border">
                    <div v-for="charge in visit.invoice.charges" :key="charge.id" class="d-flex justify-space-between mb-2">
                      <span class="text-body-2">{{ charge.description || charge.charge_type }}</span>
                      <span class="text-body-2 font-weight-bold">₹{{ charge.amount }}</span>
                    </div>
                    <VDivider class="my-2" />
                    <div class="d-flex justify-space-between">
                      <span class="text-subtitle-1 font-weight-bold">Total</span>
                      <span class="text-subtitle-1 font-weight-bold text-primary">₹{{ visit.invoice.total }}</span>
                    </div>
                  </div>
                  
                  <VBtn
                    v-if="visit.invoice.status === 'DRAFT'"
                    block
                    color="primary"
                    class="mt-4 rounded-lg elevation-4"
                    height="48"
                    :loading="payingId === visit.invoice.id"
                    @click="payInvoice(visit.invoice.id)"
                  >
                    Pay Now
                  </VBtn>
                </div>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </VCard>
      </div>
    </div>
  </PetOwnerLayout>
</template>

<style scoped>
.visits-container {
  max-width: 800px;
  margin: 0 auto;
}

.bg-grey-50 {
  background-color: #f8fafc !important;
}
</style>
