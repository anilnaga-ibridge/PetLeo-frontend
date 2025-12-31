<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import VisitStatusStepper from '@/components/veterinary/VisitStatusStepper.vue'
import DynamicFormRenderer from '@/components/veterinary/DynamicFormRenderer.vue'
import PermissionGuard from '@/components/veterinary/PermissionGuard.vue'

const route = useRoute()
const store = useVeterinaryStore()
const userData = useCookie('userData')

const visitId = route.params.id
const activeTab = ref('summary')
const loading = computed(() => store.loading)
const visit = computed(() => store.currentVisit)

onMounted(async () => {
  await store.fetchVisitSummary(visitId)
})

const tabs = [
  { value: 'summary', label: 'Summary', icon: 'tabler-file-description', capability: 'VETERINARY_CORE' },
  { value: 'vitals', label: 'Vitals', icon: 'tabler-heart-rate-monitor', capability: 'VETERINARY_VITALS' },
  { value: 'prescription', label: 'Prescription', icon: 'tabler-pill', capability: 'VETERINARY_PRESCRIPTIONS' },
  { value: 'labs', label: 'Lab Tests', icon: 'tabler-flask', capability: 'VETERINARY_LABS' },
  { value: 'vaccines', label: 'Vaccines', icon: 'tabler-vaccine', capability: 'VETERINARY_VACCINES' },
]

const onFormSubmitted = async () => {
  // Refresh data
  await store.fetchVisitSummary(visitId)
}
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="visit-detail-page">
      <!-- HEADER -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div class="d-flex align-center gap-4">
          <VBtn icon="tabler-arrow-left" variant="text" :to="{ name: 'veterinary-visits' }" />
          <div>
            <h1 class="text-h3 font-weight-bold text-primary mb-1">
              Visit #{{ visit?.id?.slice(0, 8) }}
            </h1>
            <div class="d-flex align-center gap-2 text-body-1 text-medium-emphasis">
              <VIcon icon="tabler-paw" size="18" />
              <span class="font-weight-medium">{{ visit?.pet?.name }}</span>
              <span>•</span>
              <span>{{ visit?.pet?.species }}</span>
            </div>
          </div>
        </div>
        <VChip :color="visit?.status === 'CLOSED' ? 'success' : 'primary'" class="font-weight-bold">
          {{ visit?.status?.replace(/_/g, ' ') }}
        </VChip>
      </div>

      <!-- STEPPER -->
      <VCard class="mb-6">
        <VisitStatusStepper :status="visit?.status || 'CREATED'" />
      </VCard>

      <VRow>
        <!-- LEFT: TABS -->
        <VCol cols="12" md="3">
          <VCard>
            <VTabs v-model="activeTab" direction="vertical" class="v-tabs-pill">
              <template v-for="tab in tabs" :key="tab.value">
                <PermissionGuard :capability="tab.capability">
                  <VTab :value="tab.value">
                    <VIcon :icon="tab.icon" start />
                    {{ tab.label }}
                  </VTab>
                </PermissionGuard>
              </template>
            </VTabs>
          </VCard>
        </VCol>

        <!-- RIGHT: CONTENT -->
        <VCol cols="12" md="9">
          <VWindow v-model="activeTab">
            
            <!-- SUMMARY TAB -->
            <VWindowItem value="summary">
              <VCard title="Visit Summary">
                <VCardText>
                  <VRow>
                    <VCol cols="12" md="6">
                      <h3 class="text-h6 font-weight-bold mb-2">Patient Details</h3>
                      <VList density="compact">
                        <VListItem title="Name" :subtitle="visit?.pet?.name" />
                        <VListItem title="Breed" :subtitle="visit?.pet?.breed" />
                        <VListItem title="Owner" :subtitle="visit?.pet?.owner?.name || 'Unknown'" />
                      </VList>
                    </VCol>
                    <VCol cols="12" md="6">
                      <h3 class="text-h6 font-weight-bold mb-2">Visit Info</h3>
                      <VList density="compact">
                        <VListItem title="Date" :subtitle="new Date(visit?.created_at).toLocaleString()" />
                        <VListItem title="Type" :subtitle="visit?.visit_type" />
                      </VList>
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VWindowItem>

            <!-- VITALS TAB -->
            <VWindowItem value="vitals">
              <PermissionGuard capability="VETERINARY_VITALS">
                <DynamicFormRenderer 
                  form-code="VITALS" 
                  :visit-id="visitId"
                  :initial-data="visit?.vitals || {}"
                  @submitted="onFormSubmitted"
                />
              </PermissionGuard>
            </VWindowItem>

            <!-- PRESCRIPTION TAB -->
            <VWindowItem value="prescription">
              <PermissionGuard capability="VETERINARY_PRESCRIPTIONS">
                <DynamicFormRenderer 
                  form-code="PRESCRIPTION" 
                  :visit-id="visitId"
                  @submitted="onFormSubmitted"
                />
                
                <!-- History of Prescriptions -->
                <div v-if="visit?.submissions?.filter(s => s.form_code === 'PRESCRIPTION').length" class="mt-6">
                  <h3 class="text-h5 mb-4">Prescription History</h3>
                  <VCard v-for="sub in visit.submissions.filter(s => s.form_code === 'PRESCRIPTION')" :key="sub.id" class="mb-4 border" elevation="0">
                    <VCardTitle class="text-subtitle-1">
                      Prescribed on {{ new Date(sub.created_at).toLocaleString() }}
                    </VCardTitle>
                    <VCardText>
                      <pre class="bg-background pa-2 rounded">{{ JSON.stringify(sub.data, null, 2) }}</pre>
                    </VCardText>
                  </VCard>
                </div>
              </PermissionGuard>
            </VWindowItem>

             <!-- LABS TAB -->
            <VWindowItem value="labs">
              <PermissionGuard capability="VETERINARY_LABS">
                <DynamicFormRenderer 
                  form-code="LAB_ORDER" 
                  :visit-id="visitId"
                  @submitted="onFormSubmitted"
                />
              </PermissionGuard>
            </VWindowItem>

          </VWindow>
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
