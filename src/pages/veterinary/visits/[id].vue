
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
const activeTab = ref(route.query.tab || 'summary')
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

const visibleTabs = computed(() => {
  const caps = userData.value?.capabilities || []
  const role = userData.value?.role?.name || ''
  
  // Super Admin overrides
  if (role === 'SUPERADMIN') return tabs
  
  // Filter by capability
  return tabs.filter(tab => {
    if (!tab.capability) return true
    
    return caps.includes(tab.capability)
  })
})

// Helper to calculate age from DOB
const calculateAge = dob => {
  if (!dob) return 'N/A'
  const birthDate = new Date(dob)
  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    years--
  }
  
  if (years === 0) {
    // Return months if < 1 year
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
    
    return `${months} months`
  }
  
  return `${years} years`
}

// --- PET EDIT LOGIC ---
const isEditPetDialogVisible = ref(false)
const petForm = ref({})
const petTypes = computed(() => store.petTypes)
const petBreeds = computed(() => store.petBreeds)

const filteredBreeds = computed(() => {
  let sVal = petForm.value.species
  if (!sVal) return []
    
  // Handle Species being Object or String
  // If it's an object, we want its 'name' to find the ID? 
  // Actually, if it's an object, it HAS the ID.
  let typeId = null
    
  if (typeof sVal === 'object') {
    typeId = sVal.id
  } else {
    // It's a string (e.g. "Dog" from backend)
    const typeObj = petTypes.value.find(t => t.name === sVal)
    if (typeObj) typeId = typeObj.id
  }

  if (!typeId) return [] 
    
  return petBreeds.value.filter(b => {
    const breedTypeId = (typeof b.petType === 'object') ? b.petType.id : b.petType
    
    return breedTypeId === typeId
  })
})

const openEditPet = () => {
  if (!visit.value?.pet) return
  petForm.value = JSON.parse(JSON.stringify(visit.value.pet))
  isEditPetDialogVisible.value = true
  store.fetchPetTypes()
  store.fetchPetBreeds()
}

const savePet = async () => {
  try {
    const payload = { ...petForm.value }


    // Unwrap logic (same as new.vue)
    const unwrap = val => {
      if (!val) return null
      if (typeof val === 'string') return val
      if (typeof val === 'object') {
        return val.breed || val.name || val.title || val.label || val.id || ''
      }
      
      return String(val)
    }
        
    payload.species = unwrap(payload.species)
    payload.breed = unwrap(payload.breed)
    payload.sex = unwrap(payload.sex) 
    if (payload.weight) payload.weight = parseFloat(payload.weight)

    await store.updatePet(payload.id, payload)
    isEditPetDialogVisible.value = false
    await store.fetchVisitSummary(visitId)
  } catch (e) {
    alert("Failed to update pet: " + e.message)
  }
}

const togglePetActive = async () => {
  if (!visit.value?.pet) return
  const newState = !visit.value.pet.is_active
  const action = newState ? 'Activate' : 'Deactivate'
  if (!confirm(`Are you sure you want to ${action} this pet?`)) return
    
  try {
    await store.updatePet(visit.value.pet.id, { is_active: newState })
    await store.fetchVisitSummary(visitId)
  } catch (e) {
    alert("Failed: " + e.message)
  }
}

const deletePet = async () => {
  if (!visit.value?.pet) return
  if (!confirm("Are you sure you want to DELETE this pet? This action cannot be undone.")) return
  try {
    await store.deletePet(visit.value.pet.id)

    // If deleted, refresh summary? Visit might break if pet is null?
    // Usually we redirect or show "Pet Deleted".
    await store.fetchVisitSummary(visitId)
  } catch (e) {
    alert("Failed to delete: " + e.message)
  }
}

// Doctor Workbench Logic
const showLabDialog = ref(false)
const showPrescriptionDialog = ref(false)
const submitting = ref(false)
const selectedLabs = ref([])
const medicines = ref([{ name: '', dosage: '', frequency: '1-0-1', duration: '' }])

const submitLabRequest = async () => {
  if (selectedLabs.value.length === 0) return
  submitting.value = true
  try {
    // Use Store Action to Submit Form
    await store.submitForm(visit.value.id, 'LAB_ORDER', {
      tests: selectedLabs.value,
    })
        
    // Use Store Action to Update Status
    await store.updateVisitStatus(visit.value.id, 'LAB_REQUESTED')
        
    showLabDialog.value = false

    // Fetch handled by store actions usually update currentVisit, but explicit fetch is safe
    await store.fetchVisitSummary(visitId) 
  } catch (e) {
    console.error("Failed to request labs:", e)
    alert("Failed to request labs: " + (e.response?.data?.error || e.message))
  } finally {
    submitting.value = false
  }
}

const submitPrescription = async () => {
  if (medicines.value.some(m => !m.name)) return
  submitting.value = true
  try {
    // Use Store Action to Submit Form
    await store.submitForm(visit.value.id, 'PRESCRIPTION', {
      medicines: medicines.value,
    })
        
    // Use Store Action to Update Status
    await store.updateVisitStatus(visit.value.id, 'PRESCRIPTION_FINALIZED')
        
    showPrescriptionDialog.value = false
    await store.fetchVisitSummary(visitId)
  } catch (e) {
    console.error("Failed to submit prescription:", e)
    alert("Failed to submit prescription: " + (e.response?.data?.error || e.message))
  } finally {
    submitting.value = false
  }
}

const updateStatus = async newStatus => {
  try {
    await store.updateVisitStatus(visitId, newStatus)
  } catch (e) {
    alert("Failed to update status: " + e.message)
  }
}

const onFormSubmitted = async formCode => {
  try {
    await store.fetchVisitSummary(visitId)
        
    // Hospital Workflow Status Transitions
    if (formCode === 'PRESCRIPTION') {
      await store.updateVisitStatus(visitId, 'PRESCRIPTION_FINALIZED')
    } else if (formCode === 'LAB_ORDER') {
      await store.updateVisitStatus(visitId, 'LAB_REQUESTED')
    } else if (formCode === 'LAB_RESULTS') {
      await store.updateVisitStatus(visitId, 'LAB_COMPLETED')
    }
  } catch (e) {
    console.error("Error handling form submission:", e)
  }
}

const vitalsSnapshot = computed(() => {
  const data = visit.value?.vitals || {}
  const temp = parseFloat(data.temperature || data.temp || data.Temp || 0)
  const weight = data.weight || data.Weight || 'N/A'
  const hr = data.heart_rate || data.pulse || data.hr || data.heart_rate_ || 'N/A'
  const rr = data.respiratory_rate || data.rr || 'N/A'

  return {
    weight,
    temp: temp > 0 ? `${temp}°C` : 'N/A',
    heartRate: hr,
    respRate: rr,
    hasFever: temp > 39,
  }
})
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="visit-detail-page pa-4">
      <!-- LOADING STATE -->
      <div
        v-if="loading && !visit"
        class="d-flex justify-center align-center h-screen"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="64"
        />
      </div>

      <!-- MAIN CONTENT -->
      <div v-else-if="visit">
        <!-- HEADER ACROSS TOP -->
        <VCard
          class="mb-6 border-0 shadow-lg"
          style="background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-surface), 1) 100%);"
        >
          <div class="d-flex justify-space-between align-center px-6 py-5">
            <div class="d-flex align-center gap-4">
              <VBtn
                icon="tabler-arrow-left"
                variant="tonal"
                color="primary"
                :to="{ name: 'veterinary-visits' }"
              />
              <div>
                <div class="d-flex align-center gap-3 mb-1">
                  <h1 class="text-h4 font-weight-black text-high-emphasis">
                    Visit #{{ visit.id?.slice(0, 8) }}
                  </h1>
                  <VChip
                    size="small"
                    :color="visit.status === 'CLOSED' ? 'success' : 'info'"
                    variant="elevated"
                    class="text-capitalize font-weight-bold"
                  >
                    {{ visit.status?.replace(/_/g, ' ') }}
                  </VChip>
                </div>

                <div class="d-flex align-center gap-2 text-body-1 text-medium-emphasis">
                  <VIcon
                    icon="tabler-calendar"
                    size="16"
                  />
                  <span class="font-weight-medium">{{ new Date(visit.created_at || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                  <span class="mx-2">•</span>
                  <VIcon
                    icon="tabler-clock"
                    size="16"
                  />
                  <span>{{ new Date(visit.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
              </div>
            </div>

            <!-- WORKFLOW ACTIONS -->
            <div class="d-flex gap-2">
              <!-- Reception / Nurse -->
              <VBtn
                v-if="visit.status === 'CREATED'"
                color="success"
                prepend-icon="tabler-check"
                @click="updateStatus('CHECKED_IN')"
              >
                Check In Patient
              </VBtn>

              <!-- Doctor: Start Consultation -->
              <VBtn
                v-if="visit.status === 'VITALS_RECORDED'"
                color="primary"
                prepend-icon="tabler-stethoscope"
                @click="updateStatus('DOCTOR_ASSIGNED')"
              >
                Start Consultation
              </VBtn>
                
              <!-- Doctor: In Consultation -->
              <div
                v-if="['DOCTOR_ASSIGNED', 'LAB_COMPLETED'].includes(visit.status)"
                class="d-flex gap-2"
              >
                <VBtn
                  color="info"
                  prepend-icon="tabler-test-pipe"
                  variant="tonal"
                  @click="showLabDialog = true"
                >
                  Request Lab Tests
                </VBtn>
                <VBtn
                  color="primary"
                  prepend-icon="tabler-prescription"
                  @click="showPrescriptionDialog = true"
                >
                  Write Prescription
                </VBtn>
              </div>

              <!-- Pharmacy -->
              <VBtn
                v-if="visit.status === 'MEDICINES_DISPENSED'"
                color="warning"
                prepend-icon="tabler-message-chatbot"
                @click="updateStatus('TREATMENT_COMPLETED')"
              >
                Confirm Usage Instructions
              </VBtn>
                
              <VBtn
                v-if="['PRESCRIPTION_FINALIZED', 'MEDICINES_DISPENSED'].includes(visit.status)"
                color="error"
                variant="tonal"
                prepend-icon="tabler-lock"
                @click="updateStatus('TREATMENT_COMPLETED')"
              >
                Close Visit
              </VBtn>
            </div>
          </div>

          <!-- Pet Quick Snapshot -->
          <div class="px-6 pb-4">
            <div class="d-flex align-center bg-surface px-4 py-2 rounded-lg elevation-1 border">
              <VAvatar
                size="48"
                color="primary"
                variant="tonal"
                class="mr-3"
              >
                <VIcon
                  :icon="visit.pet?.species === 'Cat' ? 'tabler-cat' : 'tabler-dog'"
                  size="28"
                />
              </VAvatar>
              <div>
                <div class="text-h6 font-weight-bold leading-tight">
                  {{ visit.pet?.name || 'Unknown Pet' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ visit.pet?.breed || 'Unknown Breed' }} • {{ calculateAge(visit.pet?.dob) }}
                </div>
              </div>
            </div>
          </div>
          
          <VDivider />
          
          <!-- STEPPER -->
          <div class="px-6 py-4 bg-surface">
            <VisitStatusStepper :status="visit.status || 'CREATED'" />
          </div>
        </VCard>

        <!-- DOCTOR DIALOGS -->
        <!-- Lab Request Dialog -->
        <VDialog
          v-model="showLabDialog"
          max-width="500"
        >
          <VCard title="Request Lab Tests">
            <VCardText>
              <VAutocomplete
                v-model="selectedLabs"
                :items="['Blood Test', 'Urine Analysis', 'X-Ray', 'Ultrasound', 'Biopsy']"
                label="Select Tests"
                multiple
                chips
                closable-chips
              />
            </VCardText>
            <VCardActions>
              <VSpacer />
              <VBtn
                text="Cancel"
                @click="showLabDialog = false"
              />
              <VBtn
                color="primary"
                text="Request Labs"
                :loading="submitting"
                @click="submitLabRequest"
              />
            </VCardActions>
          </VCard>
        </VDialog>

        <!-- Prescription Dialog -->
        <VDialog
          v-model="showPrescriptionDialog"
          max-width="800"
        >
          <VCard title="Write Prescription">
            <VCardText>
              <div
                v-for="(med, idx) in medicines"
                :key="idx"
                class="d-flex gap-3 mb-4 align-end"
              >
                <div style="flex: 2">
                  <VTextField
                    v-model="med.name"
                    label="Medicine Name"
                    density="compact"
                    hide-details
                    placeholder="e.g. Amoxicillin"
                  />
                </div>
                <div style="flex: 1">
                  <VTextField
                    v-model="med.dosage"
                    label="Dosage"
                    density="compact"
                    hide-details
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div style="flex: 1">
                  <VSelect 
                    v-model="med.frequency" 
                    :items="['1-0-0', '1-0-1', '1-1-1', '0-0-1', 'SOS']" 
                    label="Frequency" 
                    density="compact" 
                    hide-details 
                  />
                </div>
                <div style="flex: 1">
                  <VTextField
                    v-model="med.duration"
                    label="Duration"
                    density="compact"
                    hide-details
                    placeholder="e.g. 5 days"
                  />
                </div>
                <VBtn
                  icon="tabler-trash"
                  color="error"
                  variant="text"
                  size="small"
                  tabindex="-1"
                  @click="medicines.splice(idx, 1)"
                />
              </div>
              <div class="d-flex justify-start mt-2">
                <VBtn
                  prepend-icon="tabler-plus"
                  variant="tonal"
                  size="small"
                  @click="medicines.push({name: '', dosage: '', frequency: '1-0-1', duration: ''})"
                >
                  Add Medicine
                </VBtn>
              </div>
            </VCardText>
            <VCardActions>
              <VSpacer />
              <VBtn
                text="Cancel"
                @click="showPrescriptionDialog = false"
              />
              <VBtn
                color="primary"
                variant="elevated"
                text="Finalize Prescription"
                :loading="submitting"
                @click="submitPrescription"
              />
            </VCardActions>
          </VCard>
        </VDialog>

        <VRow>
          <!-- LEFT: NAVIGATION -->
          <VCol
            cols="12"
            md="3"
          >
            <VCard
              class="h-100"
              elevation="2"
            >
              <div class="pa-4 font-weight-bold text-uppercase text-caption text-medium-emphasis">
                Visit Modules
              </div>
              <VTabs
                v-model="activeTab"
                direction="vertical"
                class="v-tabs-pill custom-vertical-tabs"
                color="primary"
              >
                <template
                  v-for="tab in visibleTabs"
                  :key="tab.value"
                >
                  <VTab
                    :value="tab.value"
                    class="text-start justify-start px-6 py-4 mb-1"
                  >
                    <template #prepend>
                      <VIcon
                        :icon="tab.icon"
                        size="20"
                        class="mr-2"
                      />
                    </template>
                    <span class="font-weight-medium">{{ tab.label }}</span>
                  </VTab>
                </template>
              </VTabs>
            </VCard>
          </VCol>

          <!-- RIGHT: CONTENT -->
          <VCol
            cols="12"
            md="9"
          >
            <VWindow v-model="activeTab">
              <!-- SUMMARY TAB -->
              <VWindowItem value="summary">
                <VRow>
                  <!-- Patient Card -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VCard
                      class="h-100"
                      variant="flat"
                      border
                    >
                      <VCardItem>
                        <template #prepend>
                          <VAvatar
                            color="primary"
                            variant="tonal"
                            rounded
                          >
                            <VIcon icon="tabler-paw" />
                          </VAvatar>
                        </template>
                        <VCardTitle>Patient Information</VCardTitle>
                        <VCardSubtitle>Pet Details</VCardSubtitle>

                        <template #append>
                          <VBtn
                            icon="tabler-pencil"
                            variant="text"
                            size="small"
                            color="primary"
                            class="me-1"
                            @click="openEditPet"
                          />
                          <VMenu>
                            <template #activator="{ props }">
                              <VBtn
                                icon="tabler-dots-vertical"
                                variant="text"
                                density="compact"
                                v-bind="props"
                              />
                            </template>
                            <VList density="compact">
                              <VListItem @click="openEditPet">
                                <template #prepend>
                                  <VIcon
                                    icon="tabler-pencil"
                                    size="18"
                                  />
                                </template>
                                <VListItemTitle>Edit Details</VListItemTitle>
                              </VListItem>
                              <VListItem @click="togglePetActive">
                                <template #prepend>
                                  <VIcon
                                    :icon="visit.pet?.is_active ? 'tabler-power' : 'tabler-check'"
                                    size="18"
                                    :color="visit.pet?.is_active ? 'error' : 'success'"
                                  />
                                </template>
                                <VListItemTitle>{{ visit.pet?.is_active ? 'Deactivate' : 'Activate' }}</VListItemTitle>
                              </VListItem>
                              <VListItem
                                base-color="error"
                                @click="deletePet"
                              >
                                <template #prepend>
                                  <VIcon
                                    icon="tabler-trash"
                                    size="18"
                                  />
                                </template>
                                <VListItemTitle>Delete</VListItemTitle>
                              </VListItem>
                            </VList>
                          </VMenu>
                        </template>
                      </VCardItem>
                      <VCardText class="pt-4">
                        <VList
                          class="card-list"
                          density="compact"
                        >
                          <VListItem>
                            <template #prepend>
                              <VIcon
                                icon="tabler-id"
                                size="20"
                                class="mr-2 text-disabled"
                              />
                            </template>
                            <VListItemTitle class="font-weight-medium">
                              Name
                            </VListItemTitle>
                            <template #append>
                              <div class="d-flex align-center gap-2">
                                <VChip
                                  v-if="visit.pet?.is_active === false"
                                  size="x-small"
                                  color="error"
                                  variant="flat"
                                  label
                                >
                                  Inactive
                                </VChip>
                                <span class="text-high-emphasis">{{ visit.pet?.name }}</span>
                              </div>
                            </template>
                          </VListItem>
                          <VDivider class="my-2 border-dashed" />
                          <VListItem>
                            <template #prepend>
                              <VIcon
                                icon="tabler-dna"
                                size="20"
                                class="mr-2 text-disabled"
                              />
                            </template>
                            <VListItemTitle class="font-weight-medium">
                              Breed
                            </VListItemTitle>
                            <template #append>
                              <span class="text-high-emphasis">{{ visit.pet?.breed || 'N/A' }}</span>
                            </template>
                          </VListItem>
                          <VDivider class="my-2 border-dashed" />
                          <VListItem>
                            <template #prepend>
                              <VIcon
                                icon="tabler-gender-bigender"
                                size="20"
                                class="mr-2 text-disabled"
                              />
                            </template>
                            <VListItemTitle class="font-weight-medium">
                              Sex
                            </VListItemTitle>
                            <template #append>
                              <span class="text-high-emphasis">{{ visit.pet?.sex || 'N/A' }}</span>
                            </template>
                          </VListItem>
                          <VDivider class="my-2 border-dashed" />
                          <VListItem>
                            <template #prepend>
                              <VIcon
                                icon="tabler-cake"
                                size="20"
                                class="mr-2 text-disabled"
                              />
                            </template>
                            <VListItemTitle class="font-weight-medium">
                              Age
                            </VListItemTitle>
                            <template #append>
                              <span class="text-high-emphasis">{{ calculateAge(visit.pet?.dob) }}</span>
                            </template>
                          </VListItem>
                          <VDivider class="my-2 border-dashed" />
                          <VListItem>
                            <template #prepend>
                              <VIcon
                                icon="tabler-palette"
                                size="20"
                                class="mr-2 text-disabled"
                              />
                            </template>
                            <VListItemTitle class="font-weight-medium">
                              Color
                            </VListItemTitle>
                            <template #append>
                              <span class="text-high-emphasis">{{ visit.pet?.color || 'N/A' }}</span>
                            </template>
                          </VListItem>
                          <VDivider class="my-2 border-dashed" />
                          <VListItem>
                            <template #prepend>
                              <VIcon
                                icon="tabler-scale-outline"
                                size="20"
                                class="mr-2 text-disabled"
                              />
                            </template>
                            <VListItemTitle class="font-weight-medium">
                              Weight
                            </VListItemTitle>
                            <template #append>
                              <span class="text-high-emphasis">{{ visit.pet?.weight ? visit.pet?.weight + ' kg' : 'N/A' }}</span>
                            </template>
                          </VListItem>
                        </VList>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <!-- Owner Card -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VCard
                      class="h-100"
                      variant="flat"
                      border
                    >
                      <VCardItem>
                        <template #prepend>
                          <VAvatar
                            color="info"
                            variant="tonal"
                            rounded
                          >
                            <VIcon icon="tabler-user" />
                          </VAvatar>
                        </template>
                        <VCardTitle>Owner Information</VCardTitle>
                        <VCardSubtitle>Contact Details</VCardSubtitle>
                      </VCardItem>
                      <VCardText class="pt-4">
                        <template v-if="visit.pet?.owner">
                          <VList
                            class="card-list"
                            density="compact"
                          >
                            <VListItem>
                              <template #prepend>
                                <VIcon
                                  icon="tabler-user-circle"
                                  size="20"
                                  class="mr-2 text-disabled"
                                />
                              </template>
                              <VListItemTitle class="font-weight-medium">
                                Name
                              </VListItemTitle>
                              <template #append>
                                <span class="text-high-emphasis">{{ visit.pet.owner.name }}</span>
                              </template>
                            </VListItem>
                            <VDivider class="my-2 border-dashed" />
                            <VListItem>
                              <template #prepend>
                                <VIcon
                                  icon="tabler-phone"
                                  size="20"
                                  class="mr-2 text-disabled"
                                />
                              </template>
                              <VListItemTitle class="font-weight-medium">
                                Phone
                              </VListItemTitle>
                              <template #append>
                                <a
                                  :href="'tel:' + visit.pet.owner.phone"
                                  class="text-primary text-decoration-none"
                                >{{ visit.pet.owner.phone }}</a>
                              </template>
                            </VListItem>
                            <VDivider class="my-2 border-dashed" />
                            <VListItem>
                              <template #prepend>
                                <VIcon
                                  icon="tabler-mail"
                                  size="20"
                                  class="mr-2 text-disabled"
                                />
                              </template>
                              <VListItemTitle class="font-weight-medium">
                                Email
                              </VListItemTitle>
                              <template #append>
                                <span class="text-high-emphasis">{{ visit.pet.owner.email || 'N/A' }}</span>
                              </template>
                            </VListItem>
                          </VList>
                        </template>
                        <div
                          v-else
                          class="text-center py-6 text-disabled"
                        >
                          <VIcon
                            icon="tabler-user-off"
                            size="48"
                            class="mb-2"
                          />
                          <div>No Owner Linked</div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <!-- Doctor's Vitals Quick View -->
                  <VCol
                    cols="12"
                    class="mt-2"
                  >
                    <VCard
                      variant="flat"
                      class="vitals-summary-card border-dashed"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center gap-2 mb-4">
                          <VIcon
                            icon="tabler-heart-rate-monitor"
                            color="primary"
                          />
                          <span class="text-h6 font-weight-bold">Medical Snapshot</span>
                          <VChip
                            v-if="vitalsSnapshot.hasFever"
                            color="error"
                            size="x-small"
                            variant="elevated"
                            class="ml-2 animate-pulse"
                          >
                            <VIcon
                              icon="tabler-alert-triangle"
                              size="12"
                              class="mr-1"
                            />
                            FEVER DETECTED
                          </VChip>
                          <VSpacer />
                          <VBtn 
                            variant="tonal" 
                            color="primary" 
                            size="x-small" 
                            prepend-icon="tabler-pencil"
                            rounded="pill"
                            @click="activeTab = 'vitals'"
                          >
                            Update Vitals
                          </VBtn>
                        </div>
                        <VRow>
                          <VCol
                            cols="4"
                            class="text-center"
                          >
                            <div class="text-caption text-uppercase text-medium-emphasis">
                              Weight
                            </div>
                            <div class="text-h5 font-weight-black">
                              {{ vitalsSnapshot.weight }} <span
                                v-if="vitalsSnapshot.weight !== 'N/A'"
                                class="text-body-2"
                              >kg</span>
                            </div>
                          </VCol>
                          <VDivider
                            vertical
                            inset
                          />
                          <VCol
                            cols="4"
                            class="text-center"
                          >
                            <div class="text-caption text-uppercase text-medium-emphasis">
                              Temperature
                            </div>
                            <div
                              class="text-h5 font-weight-black"
                              :class="{'text-error': vitalsSnapshot.hasFever}"
                            >
                              {{ vitalsSnapshot.temp }}
                            </div>
                          </VCol>
                          <VDivider
                            vertical
                            inset
                          />
                          <VCol
                            cols="4"
                            class="text-center"
                          >
                            <div class="text-caption text-uppercase text-medium-emphasis">
                              Heart Rate
                            </div>
                            <div class="text-h5 font-weight-black">
                              {{ vitalsSnapshot.heartRate }} <span
                                v-if="vitalsSnapshot.heartRate !== 'N/A'"
                                class="text-body-2"
                              >bpm</span>
                            </div>
                          </VCol>
                        </VRow>
                      </VCardText>
                    </VCard>
                  </VCol>
                    
                  <!-- Visit Meta Card -->
                  <VCol cols="12">
                    <VCard
                      variant="tonal"
                      color="primary"
                      class="mt-2"
                    >
                      <VCardText class="d-flex justify-space-between align-center">
                        <div>
                          <div class="text-caption text-primary mb-1">
                            VISIT REASON
                          </div>
                          <h3 class="text-h6 text-high-emphasis">
                            {{ visit.visit_type || 'General Consultation' }}
                          </h3>
                        </div>
                        <div class="text-right">
                          <div class="text-caption text-primary mb-1">
                            ASSIGNED DOCTOR
                          </div>
                          <div class="d-flex align-center justify-end">
                            <VAvatar
                              size="24"
                              color="primary"
                              class="mr-2 text-caption"
                            >
                              DR
                            </VAvatar>
                            <span class="font-weight-bold">{{ visit.doctor_name || 'Unassigned' }}</span>
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VWindowItem>

              <!-- VITALS TAB -->
              <VWindowItem value="vitals">
                <PermissionGuard capability="VETERINARY_VITALS">
                  <VCard
                    title="Vital Signs Monitor"
                    subtitle="Record patient vitals"
                    elevation="0"
                    border
                  >
                    <VCardText>
                      <DynamicFormRenderer 
                        form-code="VITALS" 
                        :visit-id="visitId"
                        :initial-data="visit.vitals || {}"
                        @submitted="onFormSubmitted('VITALS')"
                      />
                    </VCardText>
                  </VCard>
                </PermissionGuard>
              </VWindowItem>

              <!-- PRESCRIPTION TAB -->
              <VWindowItem value="prescription">
                <PermissionGuard capability="VETERINARY_PRESCRIPTIONS">
                  <VCard
                    border
                    variant="flat"
                    class="mb-6 bg-var-theme-background"
                  >
                    <VCardText class="pa-4">
                      <div class="d-flex align-center gap-4 text-center">
                        <div class="flex-grow-1">
                          <div class="text-caption text-uppercase text-medium-emphasis">
                            Weight
                          </div>
                          <div class="text-h6 font-weight-bold">
                            {{ vitalsSnapshot.weight }} kg
                          </div>
                        </div>
                        <VDivider vertical />
                        <div class="flex-grow-1">
                          <div class="text-caption text-uppercase text-medium-emphasis">
                            Temperature
                          </div>
                          <div
                            class="text-h6 font-weight-bold"
                            :class="{'text-error': vitalsSnapshot.hasFever}"
                          >
                            {{ vitalsSnapshot.temp }}
                          </div>
                        </div>
                        <VDivider vertical />
                        <div class="flex-grow-1">
                          <div class="text-caption text-uppercase text-medium-emphasis">
                            HR
                          </div>
                          <div class="text-h6 font-weight-bold">
                            {{ vitalsSnapshot.heartRate }}
                          </div>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>

                  <VCard
                    title="Prescription Pad"
                    subtitle="Prescribe medications"
                    elevation="0"
                    border
                    class="mb-6"
                  >
                    <VCardText>
                      <DynamicFormRenderer 
                        form-code="PRESCRIPTION" 
                        :visit-id="visitId"
                        @submitted="onFormSubmitted('PRESCRIPTION')"
                      />
                    </VCardText>
                  </VCard>
                  
                  <!-- History of Prescriptions -->
                  <div v-if="visit.forms?.PRESCRIPTION?.length">
                    <div class="text-h6 mb-3 px-1">
                      Prescription History
                    </div>
                    <VCard
                      v-for="sub in visit.forms.PRESCRIPTION"
                      :key="sub.id"
                      class="mb-4 bg-var-theme-background"
                      variant="outlined"
                    >
                      <VCardItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-prescription"
                            color="primary"
                          />
                        </template>
                        <VCardTitle>Rx #{{ sub.id?.slice(0,6) }}</VCardTitle>
                        <VCardSubtitle>Issued: {{ new Date(sub.created_at).toLocaleString() }}</VCardSubtitle>
                      </VCardItem>
                      <VDivider />
                      <VCardText>
                        <VTable
                          density="compact"
                          class="text-no-wrap"
                        >
                          <thead>
                            <tr>
                              <th class="text-uppercase text-caption font-weight-bold">
                                Medicine
                              </th>
                              <th class="text-uppercase text-caption font-weight-bold">
                                Dosage
                              </th>
                              <th class="text-uppercase text-caption font-weight-bold">
                                Frequency
                              </th>
                              <th class="text-uppercase text-caption font-weight-bold">
                                Duration
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(med, idx) in (sub.data?.medicines || [])"
                              :key="idx"
                            >
                              <td class="font-weight-medium">
                                {{ med.name }}
                              </td>
                              <td>{{ med.dosage }}</td>
                              <td>
                                <VChip
                                  size="x-small"
                                  color="primary"
                                  variant="tonal"
                                >
                                  {{ med.frequency }}
                                </VChip>
                              </td>
                              <td>{{ med.duration }}</td>
                            </tr>
                            <tr v-if="!sub.data?.medicines?.length">
                              <td
                                colspan="4"
                                class="text-center text-medium-emphasis text-caption py-2"
                              >
                                No medicines listed
                              </td>
                            </tr>
                          </tbody>
                        </VTable>
                      </VCardText>
                    </VCard>
                  </div>
                </PermissionGuard>
              </VWindowItem>

              <!-- LABS TAB -->
              <VWindowItem value="labs">
                <PermissionGuard capability="VETERINARY_LABS">
                  <VCard
                    border
                    variant="flat"
                    class="mb-6 bg-var-theme-background"
                  >
                    <VCardText class="pa-4">
                      <div class="d-flex align-center gap-4 text-center">
                        <div class="flex-grow-1">
                          <div class="text-caption text-uppercase text-medium-emphasis">
                            Weight
                          </div>
                          <div class="text-h6 font-weight-bold">
                            {{ vitalsSnapshot.weight }} kg
                          </div>
                        </div>
                        <VDivider vertical />
                        <div class="flex-grow-1">
                          <div class="text-caption text-uppercase text-medium-emphasis">
                            Temperature
                          </div>
                          <div
                            class="text-h6 font-weight-bold"
                            :class="{'text-error': vitalsSnapshot.hasFever}"
                          >
                            {{ vitalsSnapshot.temp }}
                          </div>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>

                  <VCard
                    title="Lab Orders"
                    subtitle="Request laboratory tests"
                    elevation="0"
                    border
                  >
                    <VCardText>
                      <DynamicFormRenderer 
                        form-code="LAB_ORDER" 
                        :visit-id="visitId"
                        @submitted="onFormSubmitted('LAB_ORDER')"
                      />
                    </VCardText>
                  </VCard>
                </PermissionGuard>
              </VWindowItem>
              
              <!-- VACCINES TAB (Placeholder) -->
              <VWindowItem value="vaccines">
                <VEmptyState
                  icon="tabler-vaccine"
                  title="Vaccination Module"
                  text="This module is currently under development."
                />
              </VWindowItem>
            </VWindow>
          </VCol>
        </VRow>
      </div>
      
      <!-- NOT FOUND -->
      <div
        v-else
        class="d-flex justify-center align-center h-screen flex-column"
      >
        <VIcon
          icon="tabler-alert-circle"
          size="64"
          color="error"
          class="mb-4"
        />
        <h2 class="text-h4">
          Visit Not Found
        </h2>
        <p>The visit you are looking for does not exist or you do not have permission to view it.</p>
        <VBtn
          :to="{ name: 'veterinary-visits' }"
          class="mt-4"
        >
          Back to Visits
        </VBtn>
      </div>
    </div>
    <!-- EDIT PET DIALOG -->
    <VDialog
      v-model="isEditPetDialogVisible"
      max-width="600"
    >
      <VCard title="Edit Patient Details">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField 
                v-model="petForm.name" 
                label="Pet Name" 
                prepend-inner-icon="tabler-id"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppCombobox
                v-model="petForm.species"
                :items="petTypes"
                item-title="name"
                item-value="name"
                label="Species"
                prepend-inner-icon="tabler-dna"
                :return-object="true"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppCombobox
                v-model="petForm.breed"
                :items="filteredBreeds"
                item-title="breed"
                item-value="breed"
                label="Breed"
                prepend-inner-icon="tabler-category"
                :return-object="false"
                :disabled="!petForm.species"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect 
                v-model="petForm.sex" 
                :items="['Male', 'Female', 'Unknown']" 
                label="Sex" 
                prepend-inner-icon="tabler-gender-bigender"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField 
                v-model="petForm.dob" 
                label="Date of Birth" 
                type="date" 
                prepend-inner-icon="tabler-calendar"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField 
                v-model="petForm.color" 
                label="Color/Markings" 
                prepend-inner-icon="tabler-palette"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField 
                v-model="petForm.weight" 
                label="Weight (kg)" 
                type="number" 
                prepend-inner-icon="tabler-scale-outline"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="tonal"
            @click="isEditPetDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            @click="savePet"
          >
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </component>
</template>

<style scoped>
.custom-vertical-tabs :deep(.v-btn) {
    justify-content: flex-start;
    text-transform: none;
    letter-spacing: 0.01em;
}
.card-list .v-list-item--density-compact.v-list-item--one-line {
    min-height: 36px;
    padding-inline: 0 !important;
}

.vitals-summary-card {
    background-color: rgba(var(--v-theme-surface), 0.6);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.animate-pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
