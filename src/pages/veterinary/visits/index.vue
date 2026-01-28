<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout

const veterinaryStore = useVeterinaryStore()
const visits = computed(() => veterinaryStore.visitList)
const loading = computed(() => veterinaryStore.loading)

const showEditDialog = ref(false)
const selectedVisit = ref(null)

const refreshVisits = async () => {
  const clinicId = userData.value?.clinic_id || veterinaryStore.activeClinicId

  await veterinaryStore.fetchPendingVisits(userRole.value, clinicId)
}

onMounted(async () => {
  await refreshVisits()

  // Ensure pets are loaded for the dialog
  if (veterinaryStore.pets.length === 0) {
    await veterinaryStore.fetchPets()
  }
})

const editVisit = item => {
  selectedVisit.value = item
  showEditDialog.value = true
}

const deleteVisit = async visitId => {
  if (confirm('Are you sure you want to delete this visit?')) {
    try {
      await veterinaryStore.deleteVisit(visitId)
      await refreshVisits()
    } catch (e) {
      console.error("Failed to delete visit:", e)
    }
  }
}

const checkInVisit = async visitId => {
  try {
    await veterinaryStore.checkInVisit(visitId)
    await refreshVisits()
  } catch (e) {
    console.error("Failed to check in visit:", e)
  }
}

const headers = [
  { title: 'Pet', key: 'pet.name' },
  { title: 'Species', key: 'pet.species' },
  { title: 'Status', key: 'status' },
  { title: 'Created At', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const getStatusColor = status => {
  switch (status) {
  case 'CREATED': return 'primary'
  case 'VITALS_RECORDED': return 'info'
  case 'DOCTOR_ASSIGNED': return 'warning'
  case 'PRESCRIPTION_FINALIZED': return 'success'
  case 'CLOSED': return 'secondary'
  default: return 'default'
  }
}
</script>

<script>
import VisitEditDialog from '@/components/veterinary/VisitEditDialog.vue'

export default {
  components: {
    VisitEditDialog,
  },
}
</script>

<template>
  <component :is="currentLayout">
    <div class="visits-list-page pa-4">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">
            Visits
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Manage all clinic visits.
          </p>
        </div>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          :to="{ name: 'veterinary-visits-new' }"
        >
          New Visit
        </VBtn>
      </div>

      <VCard>
        <VDataTable
          :headers="headers"
          :items="visits"
          :loading="loading"
          hover
        >
          <template #item.pet.name="{ item }">
            <div class="d-flex align-center">
              <VAvatar
                color="primary"
                variant="tonal"
                size="32"
                class="me-2"
              >
                <span class="text-caption">{{ item.pet?.name?.charAt(0) }}</span>
              </VAvatar>
              <div class="d-flex flex-column">
                <span class="font-weight-medium">{{ item.pet?.name }}</span>
                <span class="text-caption text-medium-emphasis">{{ item.pet?.breed }}</span>
              </div>
            </div>
          </template>

          <template #item.status="{ item }">
            <VChip 
              :color="getStatusColor(item.status)" 
              size="small"
              class="text-uppercase font-weight-bold"
              variant="tonal"
            >
              {{ item.status.replace(/_/g, ' ') }}
            </VChip>
          </template>
          
          <template #item.created_at="{ item }">
            {{ new Date(item.created_at).toLocaleString() }}
          </template>
          
          <template #item.actions="{ item }">
            <div class="d-flex align-center justify-end gap-2">
              <VBtn 
                v-if="item.status === 'CREATED'"
                prepend-icon="tabler-login"
                variant="flat"
                size="small"
                color="success"
                class="font-weight-bold px-4"
                @click.stop="checkInVisit(item.id)"
              >
                Check In
              </VBtn>
              
              <VBtn 
                icon 
                variant="text" 
                size="small" 
                color="medium-emphasis"
                :to="{ name: 'veterinary-visits-id', params: { id: item.id } }"
              >
                <VTooltip
                  activator="parent"
                  location="top"
                >
                  View Details
                </VTooltip>
                <VIcon
                  icon="tabler-chevron-right"
                  size="20"
                />
              </VBtn>

              <VMenu location="bottom end">
                <template #activator="{ props }">
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    color="medium-emphasis"
                    v-bind="props"
                  >
                    <VIcon
                      icon="tabler-dots-vertical"
                      size="20"
                    />
                  </VBtn>
                </template>
                <VList
                  density="compact"
                  class="rounded-lg elevation-4"
                >
                  <VListItem
                    title="Edit Visit"
                    prepend-icon="tabler-edit"
                    @click="editVisit(item)"
                  />
                  <VListItem
                    title="Delete"
                    prepend-icon="tabler-trash"
                    color="error"
                    @click="deleteVisit(item.id)"
                  />
                </VList>
              </VMenu>
            </div>
          </template>
        </VDataTable>
      </VCard>

      <VisitEditDialog 
        v-model="showEditDialog"
        :visit="selectedVisit"
        @saved="refreshVisits"
      />
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
