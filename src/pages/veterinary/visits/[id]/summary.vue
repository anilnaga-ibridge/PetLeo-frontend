<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import DynamicFormRenderer from '@/components/veterinary/DynamicFormRenderer.vue'

const route = useRoute()
const store = useVeterinaryStore()
const currentLayout = VeterinaryLayout

const visit = ref(null)
const loading = ref(false)
const showPrescriptionDialog = ref(false)
const showLabDialog = ref(false)

const fetchSummary = async () => {
  loading.value = true
  try {
    visit.value = await store.fetchVisitSummary(route.params.id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchSummary)

const onFormSubmitted = () => {
  showPrescriptionDialog.value = false
  showLabDialog.value = false
  fetchSummary()
}
</script>

<template>
  <component :is="currentLayout">
    <div v-if="visit" class="visit-summary">
      <div class="d-flex align-center justify-space-between mb-6">
        <div class="d-flex align-center">
            <VBtn icon="tabler-arrow-left" variant="text" to="/veterinary/doctor-dashboard" class="me-2" />
            <div>
                <h1 class="text-h3 font-weight-bold text-primary">{{ visit.pet.name }}</h1>
                <div class="text-body-1 text-medium-emphasis">{{ visit.pet.species }} • {{ visit.pet.age }} • {{ visit.owner.name }}</div>
            </div>
        </div>
        <div class="d-flex gap-2">
            <VBtn color="error" variant="outlined">End Visit</VBtn>
        </div>
      </div>

      <VRow>
        <!-- LEFT COL: INFO & VITALS -->
        <VCol cols="12" md="4">
            <VCard title="Vitals" class="mb-4">
                <VCardText v-if="visit.forms.VITALS">
                    <div v-for="(vital, k) in visit.forms.VITALS[0].data" :key="k" class="d-flex justify-space-between mb-2">
                        <span class="text-capitalize font-weight-medium">{{ k }}</span>
                        <span>{{ vital }}</span>
                    </div>
                </VCardText>
                <VCardText v-else class="text-medium-emphasis">No vitals recorded.</VCardText>
            </VCard>
            
            <VCard title="Quick Actions">
                <VCardText class="d-flex flex-column gap-2">
                    <VBtn prepend-icon="tabler-pill" color="primary" variant="tonal" @click="showPrescriptionDialog = true">Prescribe Medicine</VBtn>
                    <VBtn prepend-icon="tabler-flask" color="secondary" variant="tonal" @click="showLabDialog = true">Order Lab Test</VBtn>
                </VCardText>
            </VCard>
        </VCol>

        <!-- RIGHT COL: TIMELINE -->
        <VCol cols="12" md="8">
            <VCard title="Visit Timeline">
                <VTimeline side="end" align="start" density="compact" class="ma-4">
                    <VTimelineItem dot-color="success" size="x-small">
                        <div class="d-flex justify-space-between">
                            <strong>Visit Created</strong>
                            <span class="text-caption">10:00 AM</span>
                        </div>
                    </VTimelineItem>
                    <VTimelineItem dot-color="primary" size="x-small">
                        <div class="d-flex justify-space-between">
                            <strong>Vitals Recorded</strong>
                            <span class="text-caption">10:10 AM</span>
                        </div>
                        <div class="text-caption">Weight: 12.5kg, Temp: 38.5C</div>
                    </VTimelineItem>
                    <!-- Dynamic Items -->
                </VTimeline>
            </VCard>
        </VCol>
      </VRow>

      <!-- Dialogs -->
      <VDialog v-model="showPrescriptionDialog" max-width="800">
        <VCard>
            <VCardTitle>Prescribe Medicine</VCardTitle>
            <VCardText>
                <DynamicFormRenderer form-code="PRESCRIPTION" :visit-id="visit.id" @submitted="onFormSubmitted" @cancel="showPrescriptionDialog = false" />
            </VCardText>
        </VCard>
      </VDialog>

      <VDialog v-model="showLabDialog" max-width="800">
        <VCard>
            <VCardTitle>Order Lab Test</VCardTitle>
            <VCardText>
                <DynamicFormRenderer form-code="LAB_ORDER" :visit-id="visit.id" @submitted="onFormSubmitted" @cancel="showLabDialog = false" />
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
