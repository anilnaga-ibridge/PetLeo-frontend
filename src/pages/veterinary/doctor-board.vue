<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'
import { VDataTable } from 'vuetify/components'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const currentLayout = VeterinaryLayout

const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)
const pendingVisits = ref([])
const loading = ref(false)

const stats = computed(() => {
  return {
    ready: pendingVisits.value.length,
    urgent: pendingVisits.value.filter(v => v.visit_type === 'URGENT').length,
    vitalsDone: pendingVisits.value.filter(v => v.status === 'VITALS_RECORDED').length,
  }
})

const vitalsForm = ref(null)

// Consultation Modal Logic
import DoctorConsultationModal from '@/components/veterinary/DoctorConsultationModal.vue'

const showConsultation = ref(false)
const selectedVisit = ref(null)

const openConsultation = async visit => {
  // Auto-transition to DOCTOR_ASSIGNED if just starting
  if (visit.status === 'VITALS_RECORDED') {
    try {
      await store.updateVisitStatus(visit.id, 'DOCTOR_ASSIGNED')
      visit.status = 'DOCTOR_ASSIGNED' // Update local state for modal
    } catch (e) {
      console.error("Failed to start consultation:", e)

      // Continue anyway? Or stop? 
      // If we fail to update status, the next step (Prescription) will likely fail too.
      // But let's let the modal open so they can retry or see data.
    }
  }
  selectedVisit.value = visit
  showConsultation.value = true
}

const onConsultationCompleted = () => {
  fetchQueue()

  // Optional: Show success snackbar
}

const loadVitalsForm = async () => {
  try {
    const def = await store.fetchFormDefinition('VITALS')

    vitalsForm.value = def
  } catch (e) {
    console.error("Failed to load vitals form definition:", e)
  }
}

const dateFilter = ref(new Date().toISOString().substr(0, 10))

const fetchQueue = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    const data = await store.fetchQueue('DOCTOR_QUEUE', activeClinicId.value, dateFilter.value)

    pendingVisits.value = data
  } catch (e) {
    console.error("Failed to fetch doctor queue:", e)
  } finally {
    loading.value = false
  }
}

const getHiddenVitalsCount = visit => {
  return getHiddenVitals(visit).length
}

const getHiddenVitals = visit => {
  if (!vitalsForm.value || !visit.vitals) return []
  const primaryKeys = ['weight', 'temperature', 'heart_rate']
  
  return vitalsForm.value.fields.filter(f => 
    visit.vitals[f.field_key] && !primaryKeys.includes(f.field_key),
  )
}

onMounted(() => {
  fetchQueue()
  loadVitalsForm()
})

const getPetIcon = species => {
  if (species?.toLowerCase() === 'dog') return 'tabler-dog'
  if (species?.toLowerCase() === 'cat') return 'tabler-cat'
  
  return 'tabler-paw'
}

const formatDate = dateStr => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const calculateAge = dob => {
  if (!dob) return 'Age Unknown'
  const birthDate = new Date(dob)
  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  let months = today.getMonth() - birthDate.getMonth()
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--
    months += 12
  }
  if (years > 0) return `${years}y ${months}m`
  
  return `${months}m`
}

const viewMode = ref('cards') // 'cards' | 'table'
</script>

<template>
  <component :is="currentLayout">
    <div class="doctor-board-page pa-6">
      <div class="d-flex justify-space-between align-center mb-8">
        <div class="d-flex align-center gap-4">
          <VAvatar
            color="primary"
            variant="tonal"
            size="56"
            class="rounded-xl"
          >
            <VIcon
              icon="tabler-stethoscope"
              size="32"
            />
          </VAvatar>
          <div>
            <h1 class="text-h2 font-weight-bold text-primary mb-1">
              OPD Register
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              Daily patient log and consultation board
            </p>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <!-- DATE FILTER -->
          <VTextField
            v-model="dateFilter"
            type="date"
            label="OPD Date"
            density="compact"
            variant="outlined"
            hide-details
            bg-color="surface"
            style="width: 160px;"
            @change="fetchQueue"
          />
            
          <VBtnToggle
            v-model="viewMode"
            mandatory
            density="comfortable"
            color="primary"
            variant="outlined"
            divided
          >
            <VBtn
              value="cards"
              icon="tabler-layout-grid"
            />
            <VBtn
              value="table"
              icon="tabler-list"
            />
          </VBtnToggle>
          <VBtn
            icon="tabler-refresh"
            variant="tonal"
            color="primary"
            :loading="loading"
            @click="fetchQueue"
          />
        </div>
      </div>

      <!-- STATS -->
      <VRow class="mb-8">
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="flat"
            color="primary-lighten-5"
            class="border"
          >
            <VCardText class="d-flex align-center gap-4">
              <VAvatar
                color="primary"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-user-check"
                  size="24"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ stats.ready }}
                </div>
                <div class="text-caption text-uppercase font-weight-bold opacity-70">
                  Ready for Consult
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="flat"
            color="warning-lighten-5"
            class="border"
          >
            <VCardText class="d-flex align-center gap-4">
              <VAvatar
                color="warning"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-stethoscope"
                  size="24"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ stats.vitalsDone }}
                </div>
                <div class="text-caption text-uppercase font-weight-bold opacity-70">
                  Vitals Recorded
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="flat"
            color="error-lighten-5"
            class="border"
          >
            <VCardText class="d-flex align-center gap-4">
              <VAvatar
                color="error"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-alert-triangle"
                  size="24"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ stats.urgent }}
                </div>
                <div class="text-caption text-uppercase font-weight-bold opacity-70">
                  Urgent Cases
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <div v-if="pendingVisits.length > 0">
        <!-- CARD VIEW -->
        <VRow v-if="viewMode === 'cards'">
          <VCol
            v-for="visit in pendingVisits"
            :key="visit.id"
            cols="12"
            md="6"
            lg="4"
          >
            <VCard
              class="patient-consult-card border"
              variant="flat"
            >
              <VCardText class="pa-5">
                <!-- HEADER: PET PROFILE -->
                <div class="d-flex gap-4 mb-4">
                  <VAvatar
                    size="64"
                    :color="visit.pet?.species === 'Cat' ? 'orange-lighten-5' : 'blue-lighten-5'"
                    variant="flat"
                    class="rounded-lg"
                  >
                    <VIcon
                      :icon="getPetIcon(visit.pet?.species)"
                      size="36"
                      :color="visit.pet?.species === 'Cat' ? 'orange' : 'blue'"
                    />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-space-between align-start">
                      <div>
                        <div class="text-h5 font-weight-bold text-high-emphasis">
                          {{ visit.pet?.name }}
                        </div>
                        <div class="text-body-2 text-medium-emphasis">
                          {{ visit.pet?.breed }} • {{ visit.pet?.sex }}
                        </div>
                      </div>
                      <VChip
                        size="small"
                        :color="visit.status === 'LAB_RESULTS_READY' ? 'success' : 'primary'"
                        variant="tonal"
                        class="font-weight-bold"
                      >
                        {{ visit.status === 'LAB_RESULTS_READY' ? 'Labs Ready' : 'Vitals OK' }}
                      </VChip>
                    </div>
                    <div class="text-caption text-disabled mt-1">
                      {{ calculateAge(visit.pet?.dob) }} old
                    </div>
                  </div>
                </div>

                <VDivider class="mb-4" />

                <!-- VITALS SNAPSHOT (Dynamic) -->
                <div
                  v-if="visit.vitals && vitalsForm"
                  class="bg-grey-50 rounded-lg pa-3 mb-4 border border-dashed"
                >
                  <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                    Collected Vitals
                  </div>
                  <div class="v-row ma-0">
                    <div
                      v-for="field in vitalsForm.fields"
                      :key="field.field_key"
                      class="v-col-4 pa-2 d-flex flex-column align-center border-opacity-25"
                      style="min-height: 60px;"
                    >
                      <span class="text-caption text-medium-emphasis text-center line-height-1">{{ field.label }}</span>
                      <span
                        class="text-body-2 font-weight-bold mt-1 text-center"
                        :class="{'text-error': field.field_key === 'temperature' && parseFloat(visit.vitals[field.field_key]) > 39.5}"
                      >
                        <template v-if="visit.vitals[field.field_key]">
                          {{ visit.vitals[field.field_key] }} <span class="text-caption text-medium-emphasis">{{ field.unit }}</span>
                        </template>
                        <template v-else>--</template>
                      </span>
                    </div>
                  </div>
                </div>
                <!-- FALLBACK if definition not loaded but vitals exist -->
                <div
                  v-else-if="visit.vitals"
                  class="bg-grey-50 rounded-lg pa-3 mb-4 border border-dashed text-center"
                >
                  <VProgressCircular
                    indeterminate
                    size="24"
                    color="primary"
                  />
                </div>

                <!-- OWNER INFO -->
                <div class="d-flex align-center justify-space-between mb-4 px-1">
                  <div class="d-flex align-center gap-2">
                    <VAvatar
                      size="24"
                      color="secondary"
                      variant="tonal"
                    >
                      <VIcon
                        icon="tabler-user"
                        size="14"
                      />
                    </VAvatar>
                    <span class="text-body-2 font-weight-medium">{{ visit.pet?.owner?.name || 'Unknown' }}</span>
                  </div>
                  <div
                    v-if="visit.pet?.owner?.phone"
                    class="d-flex align-center gap-2"
                  >
                    <VIcon
                      icon="tabler-phone"
                      size="16"
                      class="text-medium-emphasis"
                    />
                    <span class="text-caption">{{ visit.pet?.owner?.phone }}</span>
                  </div>
                </div>

                <!-- ACTION -->
                <VBtn 
                  block 
                  color="primary" 
                  variant="elevated" 
                  size="large"
                  class="rounded-xl"
                  prepend-icon="tabler-stethoscope"
                  @click="openConsultation(visit)"
                >
                  Start Consultation
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <!-- TABLE VIEW -->
        <VCard
          v-else-if="viewMode === 'table'"
          variant="flat"
          class="border"
        >
          <VDataTable
            :items="pendingVisits"
            :headers="[
              { title: 'Pet Profile', key: 'pet' },
              { title: 'Owner', key: 'owner' },
              { title: 'Vitals Summary', key: 'vitals' },
              { title: 'Wait Time', key: 'created_at' },
              { title: 'Action', key: 'actions', align: 'end' }
            ]"
            item-value="id"
            class="text-no-wrap"
          >
            <template #item.pet="{ item }">
              <div class="d-flex align-center gap-3 py-2">
                <VAvatar
                  size="40"
                  :color="item.pet?.species === 'Cat' ? 'orange-lighten-5' : 'blue-lighten-5'"
                  variant="flat"
                  class="rounded"
                >
                  <VIcon
                    :icon="getPetIcon(item.pet?.species)"
                    size="24"
                    :color="item.pet?.species === 'Cat' ? 'orange' : 'blue'"
                  />
                </VAvatar>
                <div>
                  <div class="font-weight-bold text-high-emphasis">
                    {{ item.pet?.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.pet?.breed }} • {{ calculateAge(item.pet?.dob) }}
                  </div>
                </div>
              </div>
            </template>

            <template #item.owner="{ item }">
              <div
                v-if="item.pet?.owner"
                class="d-flex flex-column"
              >
                <span class="text-body-2 font-weight-medium">{{ item.pet?.owner?.name }}</span>
                <span
                  v-if="item.pet?.owner?.phone"
                  class="text-caption text-medium-emphasis"
                >
                  <VIcon
                    icon="tabler-phone"
                    size="12"
                    class="me-1"
                  />{{ item.pet?.owner?.phone }}
                </span>
              </div>
            </template>

            <template #item.vitals="{ item }">
              <div v-if="item.vitals && vitalsForm">
                <div class="d-flex align-center gap-4">
                  <!-- Helper function to get vitals logic inside template is tricky, using v-for with v-if logic -->
                            
                  <!-- WEIGHT -->
                  <div
                    v-if="item.vitals.weight"
                    class="d-flex align-center gap-1"
                    title="Weight"
                  >
                    <VIcon
                      icon="tabler-weight"
                      size="16"
                      class="text-medium-emphasis"
                    />
                    <span class="text-body-2 font-weight-medium">{{ item.vitals.weight }} kg</span>
                  </div>

                  <!-- TEMP -->
                  <div
                    v-if="item.vitals.temperature"
                    class="d-flex align-center gap-1"
                    title="Temperature"
                  >
                    <VIcon
                      icon="tabler-thermometer"
                      size="16"
                      class="text-medium-emphasis"
                    />
                    <span
                      class="text-body-2 font-weight-medium"
                      :class="{'text-error': parseFloat(item.vitals.temperature) > 39.5}"
                    >
                      {{ item.vitals.temperature }}°C
                    </span>
                  </div>

                  <!-- HR -->
                  <div
                    v-if="item.vitals.heart_rate"
                    class="d-flex align-center gap-1"
                    title="Heart Rate"
                  >
                    <VIcon
                      icon="tabler-heart-rate"
                      size="16"
                      class="text-medium-emphasis"
                    />
                    <span class="text-body-2 font-weight-medium">{{ item.vitals.heart_rate }} bpm</span>
                  </div>

                  <!-- DYNAMIC OVERFLOW -->
                  <VMenu
                    v-if="getHiddenVitalsCount(item) > 0"
                    location="top"
                    open-on-hover
                    :close-on-content-click="false"
                  >
                    <template #activator="{ props }">
                      <VChip
                        v-bind="props"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        class="font-weight-bold px-2"
                      >
                        +{{ getHiddenVitalsCount(item) }}
                      </VChip>
                    </template>
                    <VCard
                      min-width="200"
                      class="pa-3"
                    >
                      <div class="text-caption font-weight-bold mb-2">
                        Other Vitals
                      </div>
                      <div
                        v-for="field in getHiddenVitals(item)"
                        :key="field.field_key"
                        class="d-flex justify-space-between align-center mb-1"
                      >
                        <span class="text-caption text-medium-emphasis">{{ field.label }}</span>
                        <span class="text-caption font-weight-bold">
                          {{ item.vitals[field.field_key] }} {{ field.unit }}
                        </span>
                      </div>
                    </VCard>
                  </VMenu>
                </div>
              </div>
              <span
                v-else
                class="text-caption text-disabled"
              >No recorded vitals</span>
            </template>

            <template #item.created_at="{ item }">
              <span class="text-body-2">{{ formatDate(item.created_at) }}</span>
            </template>

            <template #item.actions="{ item }">
              <VBtn
                color="primary"
                variant="elevated"
                size="small"
                prepend-icon="tabler-stethoscope"
                @click="openConsultation(item)"
              >
                Consult
              </VBtn>
            </template>
          </VDataTable>
        </VCard>
      </div>

      <div
        v-else
        class="text-center py-12"
      >
        <VAvatar
          size="120"
          color="primary"
          variant="tonal"
          class="mb-6"
        >
          <VIcon
            icon="tabler-clipboard-check"
            size="64"
          />
        </VAvatar>
        <h2 class="text-h2 font-weight-bold mb-2">
          No Patients Waiting
        </h2>
        <p class="text-body-1 text-medium-emphasis">
          The doctor's queue is currently empty.
        </p>
      </div>

      <!-- CONSULTATION MODAL -->
      <DoctorConsultationModal 
        v-if="selectedVisit" 
        v-model="showConsultation" 
        :visit="selectedVisit"
        @completed="onConsultationCompleted"
      />
    </div>
  </component>
</template>

<style scoped>
.patient-consult-card {
  transition: all 0.2s ease;
}
.patient-consult-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px -10px rgba(var(--v-theme-primary), 0.3);
}
.line-height-1 {
    line-height: 1.2;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
