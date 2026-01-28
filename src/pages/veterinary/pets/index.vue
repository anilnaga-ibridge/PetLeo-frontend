<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useRouter } from 'vue-router'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout

const store = useVeterinaryStore()
const router = useRouter()

const pets = computed(() => store.pets)
const loading = computed(() => store.loading)

const fetchPets = async () => {
  await store.fetchPets()
}

onMounted(async () => {
  await fetchPets()
})

const deletePet = async petId => {
  if (confirm('Are you sure you want to delete this patient? All history for this pet will be archived.')) {
    try {
      await store.deletePet(petId)
      await fetchPets()
    } catch (e) {
      console.error('Failed to delete pet:', e)
    }
  }
}

const headers = [
  { title: 'Patient', key: 'name' },
  { title: 'Species/Breed', key: 'species' },
  { title: 'Owner', key: 'owner.name' },
  { title: 'Phone', key: 'owner.phone' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script>

<template>
  <component :is="currentLayout">
    <div class="patients-list-page pa-4">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">
            Patients
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Manage all clinic patients and owners.
          </p>
        </div>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          to="/veterinary/pets/new"
        >
          New Patient
        </VBtn>
      </div>

      <VCard
        border
        elevation="0"
      >
        <VDataTable
          :headers="headers"
          :items="pets"
          :loading="loading"
          hover
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <VAvatar
                color="primary"
                variant="tonal"
                size="32"
                class="me-2"
              >
                <span class="text-caption">{{ item.name?.charAt(0) }}</span>
              </VAvatar>
              <div class="d-flex flex-column">
                <span class="font-weight-medium">{{ item.name }}</span>
                <span class="text-caption text-medium-emphasis">Tag: {{ item.tag || 'N/A' }}</span>
              </div>
            </div>
          </template>

          <template #item.species="{ item }">
            <div class="d-flex flex-column">
              <span>{{ item.species }}</span>
              <span class="text-caption text-medium-emphasis">{{ item.breed }}</span>
            </div>
          </template>

          <template #item.owner.name="{ item }">
            {{ item.owner?.name || 'Unknown' }}
          </template>

          <template #item.owner.phone="{ item }">
            {{ item.owner?.phone || 'N/A' }}
          </template>

          <template #item.is_active="{ item }">
            <VChip 
              :color="item.is_active ? 'success' : 'error'" 
              size="small"
              variant="tonal"
            >
              {{ item.is_active ? 'Active' : 'Inactive' }}
            </VChip>
          </template>
          
          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <VBtn 
                icon="tabler-edit" 
                variant="text" 
                size="small" 
                color="primary"
                @click="router.push(`/veterinary/pets/${item.id}/edit`)"
              />
              <VBtn 
                icon="tabler-trash" 
                variant="text" 
                size="small" 
                color="error"
                @click="deletePet(item.id)"
              />
            </div>
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
