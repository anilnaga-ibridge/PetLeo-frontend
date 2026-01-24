<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { veterinaryApi } from '@/api/veterinary'

const props = defineProps({
  modelValue: Boolean,
  visit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'completed'])

const store = useVeterinaryStore()
const activeTab = ref('prescription') // 'prescription', 'lab'
const loading = ref(false)

// Prescription State
const medicines = ref([{ name: '', dosage: '', frequency: '1-0-1', duration: '' }])

// Lab State
const selectedLabs = ref([])
const labTests = ['Blood Test', 'Urine Analysis', 'X-Ray', 'Ultrasound', 'Biopsy', 'Skin Scraping']

// Helpers
const vitalsSnapshot = computed(() => {
  const data = props.visit.vitals || {}
  
  return {
    weight: data.weight || 'N/A',
    temp: parseFloat(data.temperature || 0),
    hr: data.heart_rate || 'N/A',
  }
})

const hasPrescription = computed(() => medicines.value.some(m => m.name && m.name.trim() !== ''))
const hasLabs = computed(() => selectedLabs.value.length > 0)

const close = () => {
  emit('update:modelValue', false)

  // Reset state
  setTimeout(() => {
    activeTab.value = 'prescription'
    medicines.value = [{ name: '', dosage: '', frequency: '1-0-1', duration: '' }]
    selectedLabs.value = []
  }, 300)
}

const fetchVisitDetails = async () => {
  if (!props.visit?.id) return
  loading.value = true
  try {
    const fullVisit = await store.fetchVisitSummary(props.visit.id)
        
    // 1. Populate Prescription
    if (fullVisit.prescription && Array.isArray(fullVisit.prescription.medicines)) {
      medicines.value = JSON.parse(JSON.stringify(fullVisit.prescription.medicines))
      if (medicines.value.length === 0) {
        medicines.value = [{ name: '', dosage: '', frequency: '1-0-1', duration: '' }]
      }
    }

    // 2. Populate Labs
    if (fullVisit.lab_order && Array.isArray(fullVisit.lab_order.tests)) {
      selectedLabs.value = [...fullVisit.lab_order.tests]
    }
  } catch (e) {
    console.error("Failed to load existing consultation data:", e)
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, newVal => {
  if (newVal) {
    fetchVisitDetails()
  }
})

onMounted(() => {
  if (props.modelValue) {
    fetchVisitDetails()
  }
})

const ensureDoctorAssigned = async () => {
  // Only attempt transition if we are in an earlier state
  const currentStatus = props.visit.status
  if (['CREATED', 'CHECKED_IN', 'VITALS_RECORDED'].includes(currentStatus)) {
    try {
      console.log(`[Safety] Forcing DOCTOR_ASSIGNED state via direct API...`)
      await veterinaryApi.post(`/veterinary/visits/${props.visit.id}/transition/`, { status: 'DOCTOR_ASSIGNED' })
      await store.fetchVisitSummary(props.visit.id)
    } catch (e) {
      console.error("Auto-assign doctor failed:", e)
    }
  }
}

const submitConsultation = async () => {
  if (!hasPrescription.value && !hasLabs.value) {
    alert("Please enter a prescription or select lab tests before completing.")
    
    return
  }

  loading.value = true
  try {
    await ensureDoctorAssigned()

    // 1. Submit Prescription if exists
    if (hasPrescription.value) {
      await store.submitForm(props.visit.id, 'PRESCRIPTION', {
        medicines: medicines.value.filter(m => m.name),
      })
    }

    // 2. Submit Labs if exists
    if (hasLabs.value) {
      await store.submitForm(props.visit.id, 'LAB_ORDER', {
        tests: selectedLabs.value,
      })
    }

    // 3. Determine Next Status
    // Priority: Labs -> Prescription -> (Nothing?)
    // If Labs are ordered, patient usually goes to Lab next.
    // If only Prescription, patient goes to Pharmacy.
    let nextStatus = null
    if (hasLabs.value) {
      nextStatus = 'LAB_REQUESTED'
    } else if (hasPrescription.value) {
      nextStatus = 'PRESCRIPTION_FINALIZED'
    }

    if (nextStatus) {
      await store.updateVisitStatus(props.visit.id, nextStatus)
    }
        
    emit('completed')
    close()
  } catch (e) {
    console.error(e)
    alert("Failed to submit consultation: " + (e.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="1100"
    persistent
    @update:model-value="close"
  >
    <VCard
      class="d-flex flex-column"
      style="min-height: 700px;"
    >
      <!-- HEADER -->
      <VToolbar
        color="primary"
        density="compact"
      >
        <VBtn
          icon="tabler-x"
          variant="text"
          @click="close"
        />
        <VToolbarTitle class="font-weight-bold">
          Consultation: {{ visit.pet?.name }}
        </VToolbarTitle>
        <div class="px-4 text-caption font-weight-medium opacity-90">
          {{ visit.pet?.breed }} • {{ visit.pet?.sex }} • {{ visit.pet?.owner?.name }}
        </div>
      </VToolbar>

      <div class="d-flex flex-grow-1 overflow-hidden">
        <!-- LEFT SIDEBAR: Context & Navigation -->
        <div class="v-col-3 border-e bg-grey-50 pa-0 d-flex flex-column">
          <!-- NAV -->
          <div class="pa-4 border-b">
            <div class="text-caption font-weight-bold text-medium-emphasis mb-2 text-uppercase">
              Actions
            </div>
            <VList
              density="compact"
              nav
              class="bg-transparent pa-0"
            >
              <VListItem 
                value="prescription" 
                :active="activeTab === 'prescription'"
                active-color="primary"
                rounded="lg"
                class="mb-1"
                @click="activeTab = 'prescription'"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-prescription"
                    size="20"
                  />
                </template>
                <VListItemTitle class="font-weight-medium">
                  Prescription
                </VListItemTitle>
                <template
                  v-if="hasPrescription"
                  #append
                >
                  <VIcon
                    icon="tabler-check"
                    color="success"
                    size="16"
                  />
                </template>
              </VListItem>

              <VListItem 
                value="lab" 
                :active="activeTab === 'lab'"
                active-color="info"
                rounded="lg"
                @click="activeTab = 'lab'"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-microscope"
                    size="20"
                  />
                </template>
                <VListItemTitle class="font-weight-medium">
                  Lab Request
                </VListItemTitle>
                <template
                  v-if="hasLabs"
                  #append
                >
                  <VIcon
                    icon="tabler-check"
                    color="success"
                    size="16"
                  />
                </template>
              </VListItem>
            </VList>
          </div>

          <!-- VITALS & SOAP -->
          <div class="pa-4 flex-grow-1 overflow-y-auto">
            <VCard
              variant="outlined"
              class="bg-surface mb-4"
            >
              <VCardItem
                density="compact"
                class="pa-3 bg-secondary-lighten-5"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-heart-rate-monitor"
                    size="18"
                    color="secondary"
                  />
                </template> 
                <VCardTitle class="text-caption font-weight-bold text-uppercase">
                  Vitals
                </VCardTitle>
              </VCardItem>
              <VDivider />
              <VCardText class="pa-3">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption text-medium-emphasis">Weight</span>
                  <span class="text-body-2 font-weight-bold">{{ vitalsSnapshot.weight }} kg</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption text-medium-emphasis">Temp</span>
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="{'text-error': vitalsSnapshot.temp > 39.5}"
                  >{{ vitalsSnapshot.temp }}°C</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span class="text-caption text-medium-emphasis">HR</span>
                  <span class="text-body-2 font-weight-bold">{{ vitalsSnapshot.hr }} bpm</span>
                </div>
              </VCardText>
            </VCard>

            <VCard
              variant="outlined"
              class="bg-surface"
            >
              <VCardItem
                density="compact"
                class="pa-3"
              >
                <VCardTitle class="text-caption font-weight-bold text-uppercase">
                  Visit Reason
                </VCardTitle>
              </VCardItem>
              <VDivider />
              <VCardText class="pa-3 text-body-2">
                {{ visit.reason || 'Routine Checkup' }}
              </VCardText>
            </VCard>
          </div>
        </div>

        <!-- MAIN WORKBENCH -->
        <div class="v-col-9 pa-6 d-flex flex-column h-100 overflow-hidden">
          <!-- PRESCRIPTION TAB -->
          <div
            v-show="activeTab === 'prescription'"
            class="d-flex flex-column h-100 animate-fade-in"
          >
            <div class="mb-4">
              <h3 class="text-h5 font-weight-bold">
                Prescription Pad
              </h3>
              <p class="text-caption text-medium-emphasis">
                Add medications for {{ visit.pet?.name }}
              </p>
            </div>

            <div class="flex-grow-1 overflow-y-auto pr-2 pb-4">
              <div
                v-for="(med, idx) in medicines"
                :key="idx"
                class="d-flex gap-3 mb-4 align-end bg-grey-50 pa-3 rounded border border-dashed"
              >
                <div style="flex: 3">
                  <VTextField
                    v-model="med.name"
                    label="Medicine"
                    density="compact"
                    bg-color="surface"
                    hide-details
                    placeholder="Name"
                    variant="outlined"
                  />
                </div>
                <div style="flex: 2">
                  <VTextField
                    v-model="med.dosage"
                    label="Dosage"
                    density="compact"
                    bg-color="surface"
                    hide-details
                    placeholder="mg/ml"
                    variant="outlined"
                  />
                </div>
                <div style="flex: 2">
                  <VSelect 
                    v-model="med.frequency" 
                    :items="['1-0-0', '1-0-1', '1-1-1', '0-0-1', 'SOS']" 
                    label="Freq" 
                    density="compact" 
                    bg-color="surface"
                    hide-details 
                    variant="outlined"
                  />
                </div>
                <div style="flex: 2">
                  <VTextField
                    v-model="med.duration"
                    label="Days"
                    density="compact"
                    bg-color="surface"
                    hide-details
                    placeholder="ex. 5"
                    type="number"
                    variant="outlined"
                  />
                </div>
                <VBtn
                  icon="tabler-trash"
                  color="error"
                  variant="text"
                  size="small"
                  @click="medicines.splice(idx, 1)"
                />
              </div>
              <VBtn
                prepend-icon="tabler-plus"
                variant="tonal"
                border
                style="border-style: dashed !important"
                class="w-100"
                @click="medicines.push({name: '', dosage: '', frequency: '1-0-1', duration: ''})"
              >
                Add Medicine
              </VBtn>
            </div>
          </div>

          <!-- LAB TAB -->
          <div
            v-show="activeTab === 'lab'"
            class="d-flex flex-column h-100 animate-fade-in"
          >
            <div class="mb-4">
              <h3 class="text-h5 font-weight-bold text-info">
                Lab Request
              </h3>
              <p class="text-caption text-medium-emphasis">
                Select tests for {{ visit.pet?.name }}
              </p>
            </div>

            <div class="flex-grow-1">
              <VAutocomplete
                v-model="selectedLabs"
                :items="labTests"
                label="Search & Select Tests"
                multiple
                chips
                closable-chips
                variant="outlined"
                class="mb-6"
                placeholder="e.g. Blood Test"
              />
                        
              <div
                v-if="selectedLabs.length > 0"
                class="pa-4 bg-info-lighten-5 rounded border border-info border-dashed"
              >
                <div class="text-caption font-weight-bold text-info mb-3">
                  SELECTED TESTS QUEUE:
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <VChip
                    v-for="test in selectedLabs"
                    :key="test"
                    color="info"
                    label
                    class="font-weight-bold"
                  >
                    <VIcon
                      start
                      icon="tabler-test-pipe"
                      size="14"
                    />
                    {{ test }}
                  </VChip>
                </div>
              </div>
              <div
                v-else
                class="text-center py-12 text-disabled border border-dashed rounded bg-grey-50"
              >
                <VIcon
                  icon="tabler-microscope"
                  size="48"
                  class="mb-2 opacity-50"
                />
                <div class="text-body-2">
                  No tests selected yet.
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER (Shared) -->
          <div class="border-t pt-4 mt-auto d-flex align-center justify-space-between">
            <div class="text-caption text-medium-emphasis">
              <span
                v-if="hasPrescription"
                class="text-primary font-weight-bold me-3"
              >
                <VIcon
                  icon="tabler-pill"
                  size="14"
                  class="me-1"
                />
                {{ medicines.filter(m=>m.name).length }} Meds
              </span>
              <span
                v-if="hasLabs"
                class="text-info font-weight-bold"
              >
                <VIcon
                  icon="tabler-microscope"
                  size="14"
                  class="me-1"
                />
                {{ selectedLabs.length }} Tests
              </span>
            </div>
            <div class="d-flex gap-3">
              <VBtn
                color="secondary"
                variant="tonal"
                @click="close"
              >
                Cancel
              </VBtn>
              <VBtn 
                color="success" 
                variant="elevated" 
                :loading="loading" 
                prepend-icon="tabler-check"
                :disabled="!hasPrescription && !hasLabs"
                @click="submitConsultation"
              >
                Complete Consultation
              </VBtn>
            </div>
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
