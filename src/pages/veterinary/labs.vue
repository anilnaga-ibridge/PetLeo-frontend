<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import DynamicFormRenderer from '@/components/veterinary/DynamicFormRenderer.vue'

const store = useVeterinaryStore()
const currentLayout = VeterinaryLayout
const loading = ref(false)
const visits = ref([])
const selectedVisit = ref(null)

const fetchLabQueue = async () => {
  loading.value = true
  try {
    visits.value = await store.fetchQueue('LAB_QUEUE')
  } catch (e) {
    console.error("Failed to fetch lab queue:", e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchLabQueue)

const selectVisit = async visit => {
  loading.value = true
  try {
    const summary = await store.fetchVisitSummary(visit.id)

    selectedVisit.value = summary
  } catch (e) {
    console.error("Failed to load visit details:", e)
  } finally {
    loading.value = false
  }
}

const onResultsSubmitted = async () => {
  // Status transition is handled by DynamicFormRenderer -> onFormSubmitted in visits/[id].vue
  // But here we are in labs.vue, so we manually ensure it moves to LAB_COMPLETED
  await store.updateVisitStatus(selectedVisit.value.id, 'LAB_COMPLETED')
  selectedVisit.value = null
  fetchLabQueue()
}

const calculateAge = dob => {
  if (!dob) return 'N/A'
  const birthDate = new Date(dob)
  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  if (years === 0) return 'Baby'
  
  return `${years} yrs`
}

const formatLabTests = tests => {
  if (!tests) return ''
  if (Array.isArray(tests)) return tests.join(', ')

  // If it's a string looking like an array (e.g. '["A", "B"]'), try to parse it
  if (typeof tests === 'string' && tests.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(tests)
      if (Array.isArray(parsed)) return parsed.join(', ')
    } catch (e) {
      return tests
    }
  }
  
  return tests
}
</script>

<template>
  <component :is="currentLayout">
    <div class="lab-dashboard pa-6">
      <!-- HEADER -->
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-black d-flex align-center gap-2">
            <VIcon
              icon="tabler-flask"
              color="primary"
              size="32"
            />
            Lab Department
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Diagnostic queue and results entry.
          </p>
        </div>
        <VBtn 
          v-if="!selectedVisit"
          prepend-icon="tabler-refresh" 
          variant="tonal" 
          color="primary" 
          :loading="loading" 
          @click="fetchLabQueue"
        >
          Refresh Queue
        </VBtn>
        <VBtn 
          v-else
          prepend-icon="tabler-arrow-left" 
          variant="tonal" 
          color="secondary" 
          @click="selectedVisit = null"
        >
          Back to Queue
        </VBtn>
      </div>

      <!-- QUEUE VIEW -->
      <div v-if="!selectedVisit">
        <VRow v-if="visits.length > 0">
          <VCol
            v-for="visit in visits"
            :key="visit.id"
            cols="12"
            md="6"
            lg="4"
          >
            <VCard
              variant="flat"
              border
              class="lab-visit-card hover-lift"
            >
              <VCardItem>
                <template #prepend>
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    size="48"
                  >
                    <VIcon :icon="visit.pet?.species === 'Cat' ? 'tabler-cat' : 'tabler-dog'" />
                  </VAvatar>
                </template>
                <VCardTitle class="font-weight-bold">
                  {{ visit.pet?.name }}
                </VCardTitle>
                <VCardSubtitle>{{ visit.pet?.breed }} • {{ visit.pet?.owner?.name }}</VCardSubtitle>
              </VCardItem>
              
              <VDivider />
              
              <VCardText class="pa-4">
                <div class="d-flex justify-space-between mb-4">
                  <div class="text-caption text-uppercase font-weight-bold text-disabled">
                    Req. By
                  </div>
                  <div class="text-body-2 font-weight-medium">
                    Dr. Smith
                  </div>
                </div>
                
                <div class="bg-primary-light pa-3 rounded-lg border-primary-subtle mb-4">
                  <div class="text-caption text-primary font-weight-bold mb-1">
                    ORDERED TESTS:
                  </div>
                  <div class="text-body-2 font-weight-bold">
                    <!-- Assuming laboratory tests were ordered -->
                    {{ formatLabTests(visit.latest_lab_order?.tests) || visit.reason || 'Pending Specific Tests' }}
                  </div>
                </div>

                <VBtn
                  block
                  color="primary"
                  prepend-icon="tabler-microscope"
                  @click="selectVisit(visit)"
                >
                  Enter Results
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <div
          v-else-if="!loading"
          class="text-center py-12"
        >
          <VIcon
            icon="tabler-check"
            size="48"
            color="success"
            class="mb-2"
          />
          <h3 class="text-h6 font-weight-bold">
            Queue Clear!
          </h3>
          <p class="text-body-1 text-disabled">
            No pending lab requests at the moment.
          </p>
        </div>
      </div>

      <!-- ENTRY VIEW -->
      <div
        v-else
        class="results-entry-view animate-fade-in"
      >
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VCard
              variant="flat"
              border
              class="mb-4"
            >
              <VCardItem class="bg-primary text-white">
                <VCardTitle>Patient Identity</VCardTitle>
              </VCardItem>
              <VCardText class="pt-4">
                <div class="d-flex align-center gap-3 mb-4">
                  <VAvatar
                    size="64"
                    border
                    color="surface"
                  >
                    <VIcon
                      :icon="selectedVisit.pet?.species === 'Cat' ? 'tabler-cat' : 'tabler-dog'"
                      color="primary"
                      size="32"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-h5 font-weight-black">
                      {{ selectedVisit.pet?.name }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      ID: {{ selectedVisit.pet?.id?.slice(0,8) }}
                    </div>
                  </div>
                </div>
                <VDivider class="mb-4" />
                <VList density="compact">
                  <VListItemTitle class="text-caption text-disabled text-uppercase mb-1">
                    Owner
                  </VListItemTitle>
                  <VListItemSubtitle class="text-body-1 font-weight-bold mb-3">
                    {{ selectedVisit.owner?.name }}
                  </VListItemSubtitle>
                    
                  <VListItemTitle class="text-caption text-disabled text-uppercase mb-1">
                    Doctor Assigned
                  </VListItemTitle>
                  <VListItemSubtitle class="text-body-1 font-weight-bold mb-3">
                    Dr. Smith
                  </VListItemSubtitle>
                </VList>
              </VCardText>
            </VCard>

            <VCard
              variant="flat"
              border
              color="info-lighten-5"
            >
              <VCardText class="pa-4">
                <div class="text-h6 font-weight-bold mb-2">
                  Request Details
                </div>
                <div class="text-body-1 pa-3 bg-white border rounded">
                  {{ selectedVisit.lab_order?.tests || 'Standard Diagnostic Panel' }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="8"
          >
            <VCard
              variant="flat"
              border
              class="pa-6 rounded-xl"
            >
              <div class="text-h5 font-weight-black mb-6">
                Diagnostic Results Entry
              </div>
              <DynamicFormRenderer 
                form-code="LAB_RESULTS" 
                :visit-id="selectedVisit.id"
                @submitted="onResultsSubmitted"
              />
            </VCard>
          </VCol>
        </VRow>
      </div>
    </div>
  </component>
</template>

<style scoped>
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1) !important;
}
.bg-primary-light {
    background-color: rgba(var(--v-theme-primary), 0.05);
}
.border-primary-subtle {
    border: 1px solid rgba(var(--v-theme-primary), 0.1);
}
.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
