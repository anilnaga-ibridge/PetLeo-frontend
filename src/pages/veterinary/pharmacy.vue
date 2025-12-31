<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const store = useVeterinaryStore()
const currentLayout = VeterinaryLayout

const pendingPrescriptions = ref([])
const loading = ref(false)

const fetchPending = async () => {
  loading.value = true
  try {
    // Mock data
    pendingPrescriptions.value = [
        { 
            id: '201', 
            visit: { id: '101', pet: { name: 'Max' }, owner: { name: 'John Doe' } },
            data: { medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: '1-0-1', days: 5 }] },
            created_at: '2025-12-30 11:00'
        }
    ]
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPending)

const dispense = async (submissionId) => {
    // Call API to dispense
    alert(`Dispensed prescription ${submissionId}`)
    fetchPending()
}
</script>

<template>
  <component :is="currentLayout">
    <div class="pharmacy-page">
      <h1 class="text-h3 font-weight-bold text-primary mb-6">Pharmacy</h1>

      <VRow>
        <VCol v-for="presc in pendingPrescriptions" :key="presc.id" cols="12" md="6">
            <VCard class="mb-4 border">
                <VCardTitle class="d-flex justify-space-between">
                    <span>{{ presc.visit.pet.name }} ({{ presc.visit.owner.name }})</span>
                    <span class="text-caption">{{ presc.created_at }}</span>
                </VCardTitle>
                <VCardText>
                    <VList density="compact">
                        <VListItem v-for="(med, i) in presc.data.medicines" :key="i">
                            <template #prepend>
                                <VIcon icon="tabler-pill" size="small" class="me-2" />
                            </template>
                            <VListItemTitle>{{ med.name }} - {{ med.dosage }}</VListItemTitle>
                            <VListItemSubtitle>{{ med.frequency }} for {{ med.days }} days</VListItemSubtitle>
                        </VListItem>
                    </VList>
                </VCardText>
                <VCardActions>
                    <VSpacer />
                    <VBtn color="success" variant="elevated" @click="dispense(presc.id)">
                        Dispense & Notify
                    </VBtn>
                </VCardActions>
            </VCard>
        </VCol>
      </VRow>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
