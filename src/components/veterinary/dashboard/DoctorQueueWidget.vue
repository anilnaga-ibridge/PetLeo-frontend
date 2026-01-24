<script setup>
import { ref, onMounted, computed } from 'vue'
import { VDataTable } from 'vuetify/components'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'
import VisitEditDialog from '@/components/veterinary/VisitEditDialog.vue'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const visits = ref([])
const showEditDialog = ref(false)
const selectedVisit = ref(null)

const fetchQueue = async () => {
  if (!activeClinicId.value) return
  try {
    const data = await store.fetchQueue('DOCTOR_QUEUE', activeClinicId.value)

    visits.value = data
  } catch (e) {
    console.error("Failed to fetch doctor queue:", e)
  }
}

const editVisit = item => {
  selectedVisit.value = item
  showEditDialog.value = true
}

const deleteVisit = async visitId => {
  if (confirm('Are you sure you want to delete this visit?')) {
    try {
      await store.deleteVisit(visitId)
      await fetchQueue()
    } catch (e) {
      console.error("Failed to delete visit:", e)
    }
  }
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

const getPetIcon = species => {
  const s = (species || '').toLowerCase()
  
  return s === 'cat' ? 'tabler-cat' : 'tabler-dog'
}

onMounted(() => {
  fetchQueue()
})
</script>

<template>
  <VCard
    title="My Patients (Ready for Consult)"
    class="mb-6 border-0"
    elevation="0"
  >
    <div class="d-flex flex-wrap gap-4 mt-2">
      <div
        v-if="visits.length === 0"
        class="w-100 text-center py-8 text-medium-emphasis"
      >
        No patients waiting for consultation.
      </div>

      <VCard 
        v-for="visit in visits" 
        :key="visit.id"
        width="350"
        class="d-flex flex-column border rounded-lg"
        elevation="2"
      >
        <!-- HEADER: TIME & STATUS -->
        <div class="d-flex justify-space-between align-center px-4 py-3 bg-surface border-b">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="tabler-clock"
              size="16"
              class="text-medium-emphasis"
            />
            <span class="text-caption font-weight-bold text-medium-emphasis">
              {{ new Date(visit.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
            </span>
          </div>
           
          <VChip
            size="small"
            :color="visit.status === 'VITALS_RECORDED' ? 'success' : 'info'"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ visit.status === 'VITALS_RECORDED' ? 'Ready for Consult' : visit.status.replace(/_/g, ' ') }}
          </VChip>
        </div>

        <!-- BODY: PATIENT & VITALS -->
        <div class="px-4 py-4 flex-grow-1">
          <!-- PET PROFILE -->
          <div class="d-flex gap-3 mb-4">
            <VAvatar
              size="56"
              :color="visit.pet?.species === 'Cat' ? 'orange-lighten-5' : 'blue-lighten-5'"
              variant="flat"
              class="rounded-lg"
            >
              <VIcon
                :icon="getPetIcon(visit.pet?.species)"
                size="32"
                :color="visit.pet?.species === 'Cat' ? 'orange' : 'blue'"
              />
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ visit.pet?.name }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ visit.pet?.breed }} • {{ visit.pet?.sex }}
              </div>
              <div class="text-caption text-disabled">
                {{ calculateAge(visit.pet?.dob) }}
              </div>
            </div>
          </div>

          <VDivider class="mb-3" />

          <!-- OWNER INFO -->
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-user"
                size="18"
                class="text-medium-emphasis"
              />
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

          <!-- VITALS SNAPSHOT (If recorded) -->
          <div
            v-if="visit.status === 'VITALS_RECORDED' && visit.vitals"
            class="bg-grey-100 rounded px-3 py-2 mt-2"
          >
            <div class="d-flex justify-space-between text-caption">
              <span class="font-weight-bold text-medium-emphasis">Weight:</span>
              <span>{{ visit.vitals.weight || '--' }} kg</span>
            </div>
            <div class="d-flex justify-space-between text-caption mt-1">
              <span class="font-weight-bold text-medium-emphasis">Temp:</span>
              <span :class="{'text-error font-weight-bold': parseFloat(visit.vitals.temperature) > 39.5}">
                {{ visit.vitals.temperature || '--' }}°C
              </span>
            </div>
          </div>
        </div>

        <!-- FOOTER: ACTIONS -->
        <div class="px-4 py-3 bg-grey-50 border-t d-flex gap-2">
          <VBtn
            block
            color="primary"
            :to="{ name: 'veterinary-visits-id', params: { id: visit.id } }"
          >
            Start Consultation
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            color="medium-emphasis"
            @click="editVisit(visit)"
          >
            <VIcon icon="tabler-dots-vertical" />
          </VBtn>
        </div>
      </VCard>
    </div>

    <VisitEditDialog 
      v-model="showEditDialog"
      :visit="selectedVisit"
      @saved="fetchQueue"
    />
  </VCard>
</template>
