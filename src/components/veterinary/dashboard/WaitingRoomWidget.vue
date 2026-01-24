<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { VDataTable } from 'vuetify/components'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const activeTab = ref('waiting')
const waitingVisits = ref([])
const loading = ref(false)

const fetchQueue = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    const data = await store.fetchQueue('WAITING_ROOM', activeClinicId.value)

    waitingVisits.value = data
  } catch (e) {
    console.error("Failed to fetch waiting room:", e)
  } finally {
    loading.value = false
  }
}

const pets = computed(() => store.pets)

onMounted(() => {
  fetchQueue()
  store.fetchPets()
})

const getWaitTime = createdAt => {
  if (!createdAt) return 'N/A'
  const start = new Date(createdAt)
  const now = new Date()
  const diffMs = now - start
  
  return Math.floor(diffMs / 60000)
}

const getSlaColor = mins => {
  if (mins > 45) return 'error'
  if (mins > 30) return 'warning'
  
  return 'success'
}

const checkingIn = ref(null)
const showEditDialog = ref(false)
const selectedVisit = ref(null)

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

const checkInVisit = async visit => {
  if (!visit.id) return
  checkingIn.value = visit.id
  try {
    await store.checkInVisit(visit.id)
    await fetchQueue()
  } catch (e) {
    console.error("Failed to check-in:", e)
  } finally {
    checkingIn.value = null
  }
}
</script>

<template>
  <VCard
    class="mb-6 border"
    elevation="0"
  >
    <template #title>
      <div class="d-flex justify-space-between align-center">
        <div>
          <h3 class="text-h4 font-weight-bold">
            Reception
          </h3>
          <p class="text-subtitle-2 text-medium-emphasis mb-0">
            Register pets and manage the waiting room
          </p>
        </div>
        <VBtn 
          color="primary" 
          size="small" 
          prepend-icon="tabler-plus" 
          :disabled="!activeClinicId"
          @click="selectedVisit = null; showEditDialog = true"
        >
          Quick Check-in
        </VBtn>
      </div>
    </template>

    <VTabs
      v-if="activeClinicId"
      v-model="activeTab"
      class="px-4"
    >
      <VTab value="waiting">
        Waiting ({{ waitingVisits.length }})
      </VTab>
    </VTabs>
     
    <VWindow
      v-model="activeTab"
      class="pa-4"
    >
      <VWindowItem value="waiting">
        <div
          v-if="!activeClinicId"
          class="text-center py-8"
        >
          <VAvatar
            size="64"
            color="secondary"
            variant="tonal"
            class="mb-4"
          >
            <VIcon
              icon="tabler-building-hospital"
              size="32"
            />
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            No Clinic Selected
          </div>
          <p class="text-body-2 text-medium-emphasis">
            Please select a clinic from the top bar to view the waiting room.
          </p>
        </div>
           
        <VDataTable
          v-else
          :items="waitingVisits"
          :headers="[
            { title: 'Pet', key: 'pet.name' },
            { title: 'Owner', key: 'pet.owner.name' },
            { title: 'Wait Time', key: 'created_at' },
            { title: 'Status', key: 'status' },
            { title: 'Actions', key: 'actions' }
          ]"
          :loading="loading"
        >
          <template #item.created_at="{ item }">
            <VChip
              :color="getSlaColor(getWaitTime(item.created_at))"
              size="small"
              label
            >
              {{ getWaitTime(item.created_at) }} min
            </VChip>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex gap-2 align-center">
              <VBtn 
                v-if="item.status === 'CREATED'"
                color="success" 
                size="small" 
                variant="tonal"
                :loading="checkingIn === item.id"
                @click="checkInVisit(item)"
              >
                Check-in
              </VBtn>
              <VBtn
                v-else
                color="primary"
                size="small"
                :to="`/veterinary/visits/${item.id}/summary`"
                variant="tonal"
              >
                View
              </VBtn>
                    
              <VBtn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="editVisit(item)"
              >
                <VIcon icon="tabler-edit" />
              </VBtn>
                    
              <VBtn
                icon
                size="small"
                variant="text"
                color="error"
                @click="deleteVisit(item.id)"
              >
                <VIcon icon="tabler-trash" />
              </VBtn>
            </div>
          </template>
        </VDataTable>
      </VWindowItem>
    </VWindow>

    <VisitEditDialog 
      v-model="showEditDialog"
      :visit="selectedVisit"
      @saved="fetchQueue"
    />
  </VCard>
</template>

<script>
import VisitEditDialog from '@/components/veterinary/VisitEditDialog.vue'

export default {
  components: {
    VisitEditDialog,
  },
}
</script>
