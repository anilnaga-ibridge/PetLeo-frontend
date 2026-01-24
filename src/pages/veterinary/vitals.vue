<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, watch, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'
import VitalsEntryForm from '@/components/veterinary/VitalsEntryForm.vue'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const currentLayout = VeterinaryLayout

const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)
const pendingVisits = ref([])
const loading = ref(false)
const selectedVisit = ref(null)

const stats = computed(() => {
  const pending = pendingVisits.value.filter(v => v.status === 'CHECKED_IN').length
  const completed = pendingVisits.value.filter(v => v.status === 'VITALS_RECORDED').length
  
  return {
    pending,
    completed,
    avgWait: '12 min',
  }
})

const selectedDate = ref(new Date().toISOString().substr(0, 10))
const viewMode = ref('cards') // 'cards' or 'table'

const tableHeaders = [
  { title: 'Patient', key: 'pet', align: 'start' },
  { title: 'Check-in Time', key: 'created_at' },
  { title: 'Owner', key: 'owner' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const fetchPending = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    const data = await store.fetchQueue('VITALS_QUEUE', activeClinicId.value, { date: selectedDate.value })

    pendingVisits.value = data
  } catch (e) {
    console.error("Failed to fetch vitals queue:", e)
    pendingVisits.value = []
  } finally {
    loading.value = false
  }
}

watch(selectedDate, fetchPending)

onMounted(fetchPending)

const onVitalsSubmitted = () => {
  selectedVisit.value = null
  fetchPending() // Refresh list
}

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
  const ageDifMs = Date.now() - birthDate.getTime()
  const ageDate = new Date(ageDifMs) // miliseconds from epoch
  
  return Math.abs(ageDate.getUTCFullYear() - 1970) + ' yrs'
}
</script>

<template>
  <component :is="currentLayout">
    <div class="vitals-page pa-6">
      <!-- HEADER -->
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h2 font-weight-bold text-primary mb-1">
            Vitals Station
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Capture clinical metrics for arriving patients
          </p>
        </div>
        <div class="d-flex align-center gap-2">
          <VBtnToggle
            v-model="viewMode"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            class="rounded-lg"
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
          <VTextField 
            v-model="selectedDate" 
            type="date" 
            variant="outlined" 
            density="compact" 
            hide-details 
            style="max-width: 160px" 
            bg-color="surface"
            class="rounded-lg"
          />
          <VBtn
            icon="tabler-refresh"
            variant="tonal"
            color="primary"
            :loading="loading"
            @click="fetchPending"
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
                  icon="tabler-users"
                  size="24"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ stats.pending }}
                </div>
                <div class="text-caption text-uppercase font-weight-bold opacity-70">
                  Waiting for Vitals
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
            color="success-lighten-5"
            class="border"
          >
            <VCardText class="d-flex align-center gap-4">
              <VAvatar
                color="success"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-checklist"
                  size="24"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ stats.completed }}
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
            color="info-lighten-5"
            class="border"
          >
            <VCardText class="d-flex align-center gap-4">
              <VAvatar
                color="info"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-clock"
                  size="24"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ stats.avgWait }}
                </div>
                <div class="text-caption text-uppercase font-weight-bold opacity-70">
                  Avg. Processing Time
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>


      <!-- TABLE VIEW -->
      <VCard
        v-if="viewMode === 'table'"
        class="mb-6"
      >
        <VDataTable
          :headers="tableHeaders"
          :items="pendingVisits"
          :loading="loading"
          hover
        >
          <template #item.pet="{ item }">
            <div class="d-flex align-center gap-2 py-2">
              <VAvatar
                :color="item.pet?.species?.toLowerCase() === 'cat' ? 'orange-lighten-5' : 'blue-lighten-5'"
                variant="flat"
                class="rounded-lg"
              >
                <VIcon
                  :icon="getPetIcon(item.pet?.species)"
                  :color="item.pet?.species?.toLowerCase() === 'cat' ? 'orange' : 'blue'"
                />
              </VAvatar>
              <div>
                <div class="font-weight-bold text-high-emphasis">
                  {{ item.pet?.name }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.pet?.species }} • {{ calculateAge(item.pet?.dob) }} • {{ item.pet?.breed || 'Unknown' }}
                </div>
              </div>
            </div>
          </template>
          <template #item.owner="{ item }">
            <div>
              <div class="font-weight-bold">
                {{ item.pet?.owner?.name }}
              </div>
              <div class="text-caption">
                {{ item.pet?.owner?.phone }}
              </div>
            </div>
          </template>
          <template #item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
          <template #item.status="{ item }">
            <VChip 
              size="small" 
              :color="item.status === 'VITALS_RECORDED' ? 'success' : 'primary'" 
              variant="tonal" 
              class="font-weight-bold"
            >
              {{ item.status === 'VITALS_RECORDED' ? 'Complete' : 'Waiting' }}
            </VChip>
          </template>
          <template #item.actions="{ item }">
            <VBtn 
              :color="item.status === 'VITALS_RECORDED' ? 'success' : 'primary'"
              :variant="item.status === 'VITALS_RECORDED' ? 'tonal' : 'elevated'"
              size="small"
              class="rounded-pill"
              :prepend-icon="item.status === 'VITALS_RECORDED' ? 'tabler-pencil' : 'tabler-heart-rate-monitor'"
              @click="selectedVisit = item"
            >
              {{ item.status === 'VITALS_RECORDED' ? 'Update' : 'Record' }}
            </VBtn>
          </template>
        </VDataTable>
      </VCard>

      <!-- PATIENT BOARD (QUEUE) -->
      <div v-show="!selectedVisit">
        <div
          v-if="!activeClinicId"
          class="text-center py-12"
        >
          <VAvatar
            size="120"
            color="secondary"
            variant="tonal"
            class="mb-6"
          >
            <VIcon
              icon="tabler-building-hospital"
              size="64"
            />
          </VAvatar>
          <h2 class="text-h2 font-weight-bold mb-2">
            No Clinic Selected
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            Please select a clinic site from the top bar to manage patient vitals.
          </p>
        </div>

        <div v-else-if="pendingVisits.length > 0">
          <VRow v-if="viewMode === 'cards'">
            <VCol
              v-for="visit in pendingVisits"
              :key="visit.id"
              cols="12"
              md="6"
              lg="4"
            >
              <VCard
                class="patient-card border-dashed"
                variant="flat"
              >
                <VCardText class="pa-5">
                  <div class="d-flex justify-space-between mb-4">
                    <div class="d-flex align-center gap-3">
                      <VAvatar
                        size="56"
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon
                          :icon="getPetIcon(visit.pet.species)"
                          size="32"
                        />
                      </VAvatar>
                      <div>
                        <div class="text-h4 font-weight-bold text-high-emphasis">
                          {{ visit.pet.name }}
                        </div>
                        <div class="text-body-2 text-medium-emphasis">
                          {{ visit.pet.sex }} • {{ calculateAge(visit.pet.dob) }} • {{ visit.pet.breed || visit.pet.species }}
                        </div>
                      </div>
                    </div>
                    <VChip 
                      size="small" 
                      :color="visit.status === 'VITALS_RECORDED' ? 'success' : 'primary'" 
                      variant="tonal"
                      class="font-weight-bold"
                    >
                      {{ visit.status === 'VITALS_RECORDED' ? 'Vitals Recorded' : formatDate(visit.created_at) }}
                    </VChip>
                  </div>

                  <VDivider class="mb-4" />

                  <div class="d-flex align-center gap-2 mb-4">
                    <VIcon
                      icon="tabler-user"
                      size="18"
                      class="text-medium-emphasis"
                    />
                    <div>
                      <div class="text-body-2 font-weight-medium">
                        {{ visit.pet.owner?.name || 'Unknown Owner' }}
                      </div>
                      <div
                        v-if="visit.pet.owner?.phone"
                        class="text-caption text-medium-emphasis"
                      >
                        <VIcon
                          icon="tabler-phone"
                          size="12"
                          class="mr-1"
                        />
                        {{ visit.pet.owner.phone }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex align-center gap-2 mb-4 bg-primary-lighten-5 px-3 py-2 rounded">
                    <VIcon
                      icon="tabler-clock-check"
                      size="16"
                      color="primary"
                    />
                    <span class="text-caption font-weight-bold text-primary">Checked In: {{ formatDate(visit.created_at) }}</span>
                  </div>

                  <VBtn 
                    block 
                    :color="visit.status === 'VITALS_RECORDED' ? 'success' : 'primary'"
                    :variant="visit.status === 'VITALS_RECORDED' ? 'tonal' : 'elevated'"
                    size="large"
                    class="rounded-pill px-6"
                    :prepend-icon="visit.status === 'VITALS_RECORDED' ? 'tabler-pencil' : 'tabler-heart-rate-monitor'"
                    @click="selectedVisit = visit"
                  >
                    {{ visit.status === 'VITALS_RECORDED' ? 'Update Vitals' : 'Record Vitals' }}
                  </VBtn>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </div>

        <!-- EMPTY STATE -->
        <div
          v-else-if="activeClinicId"
          class="text-center py-12"
        >
          <VAvatar
            size="120"
            color="primary"
            variant="tonal"
            class="mb-6"
          >
            <VIcon
              icon="tabler-circle-check"
              size="64"
            />
          </VAvatar>
          <h2 class="text-h2 font-weight-bold mb-2">
            Queue is Clear
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            All checked-in patients have their vitals recorded.
          </p>
        </div>
      </div>

      <!-- INTEGRATED RECORDING FORM -->
      <div
        v-if="selectedVisit"
        class="vitals-form-container"
      >
        <VBtn 
          variant="tonal" 
          color="secondary" 
          prepend-icon="tabler-arrow-left" 
          class="mb-6 rounded-xl"
          @click="selectedVisit = null"
        >
          Back to Queue
        </VBtn>

        <VCard class="vitals-entry-card overflow-hidden border shadow-sm">
          <div class="vitals-card-header bg-primary pa-6">
            <div class="d-flex align-center gap-4">
              <VAvatar
                size="56"
                color="white"
                variant="tonal"
              >
                <VIcon
                  :icon="getPetIcon(selectedVisit.pet.species)"
                  color="white"
                  size="32"
                />
              </VAvatar>
              <div>
                <div class="text-h3 text-white font-weight-bold">
                  {{ selectedVisit.pet.name }}
                </div>
                <div class="text-body-1 text-white-opacity-70">
                  {{ selectedVisit.pet.breed || selectedVisit.pet.species }} • {{ selectedVisit.pet.sex }} • {{ calculateAge(selectedVisit.pet.dob) }}
                </div>
              </div>
              <VSpacer />
              <VChip
                color="white"
                variant="tonal"
                label
                class="font-weight-bold"
              >
                Visit ID: {{ selectedVisit.id.slice(0, 8) }}
              </VChip>
            </div>
          </div>

          <VCardText class="pa-8">
            <VitalsEntryForm
              :visit-id="selectedVisit.id"
              :pet="selectedVisit.pet"
              @submitted="onVitalsSubmitted"
              @cancel="selectedVisit = null"
            />
          </VCardText>
        </VCard>
      </div>
    </div>
  </component>
</template>

<style scoped>
.patient-card {
  transition: all 0.2s ease-in-out;
  border: 1px dashed rgba(var(--v-border-color), 0.5) !important;
}

.patient-card:hover {
  transform: translateY(-4px);
  border-color: rgb(var(--v-theme-primary)) !important;
  border-style: solid !important;
  box-shadow: 0 12px 24px -10px rgba(var(--v-theme-primary), 0.2);
}

.text-white-opacity-70 {
  color: rgba(255, 255, 255, 0.7);
}

.vitals-entry-card {
  border-radius: 20px !important;
}

.vitals-card-header {
  border-radius: 0 0 20px 20px;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
