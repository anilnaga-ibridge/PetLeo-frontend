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

onMounted(async () => {
  // Fetch visits based on role and clinic context
  // Assuming clinicId is available in userData or another store
  const clinicId = userData.value?.clinic_id || userData.value?.id // Fallback
  await veterinaryStore.fetchPendingVisits(userRole.value, clinicId)
})

const headers = [
  { title: 'Pet', key: 'pet.name' },
  { title: 'Species', key: 'pet.species' },
  { title: 'Status', key: 'status' },
  { title: 'Created At', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const getStatusColor = (status) => {
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

<template>
  <component :is="currentLayout">
    <div class="visits-list-page">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">Visits</h1>
          <p class="text-body-1 text-medium-emphasis">Manage all clinic visits.</p>
        </div>
        <VBtn color="primary" prepend-icon="tabler-plus" :to="{ name: 'veterinary-visits-new' }">New Visit</VBtn>
      </div>

      <VCard>
        <VDataTable :headers="headers" :items="visits" :loading="loading" hover>
          <template #item.pet.name="{ item }">
            <div class="d-flex align-center">
              <VAvatar color="primary" variant="tonal" size="32" class="me-2">
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
            <VBtn 
              icon="tabler-eye" 
              variant="text" 
              size="small" 
              color="primary"
              :to="{ name: 'veterinary-visits-id', params: { id: item.id } }"
            />
          </template>
        </VDataTable>
      </VCard>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
