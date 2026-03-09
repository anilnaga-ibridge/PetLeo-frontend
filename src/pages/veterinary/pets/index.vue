<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useRouter } from 'vue-router'

const userData = useCookie('userData')
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
  { title: 'Species / Breed', key: 'species' },
  { title: 'Owner Contact', key: 'owner.name' },
  { title: 'Status', key: 'is_active' },
  { title: '', key: 'actions', align: 'end', sortable: false },
]

const getSpeciesIcon = species => {
  const s = species?.toLowerCase()
  if (s === 'dog') return 'tabler-dog'
  if (s === 'cat') return 'tabler-cat'
  
  return 'tabler-paw'
}
</script>

<template>
  <component :is="currentLayout">
    <div class="patients-list-page bg-soft-blue min-h-screen">
      <!-- UNIFIED HEADER -->
      <div class="dashboard-header border-b bg-white px-8 py-4 d-flex align-center justify-space-between sticky-top shadow-sm">
        <div>
          <div class="d-flex align-center gap-2 mb-1">
            <VIcon
              icon="tabler-search"
              color="primary"
              size="20"
            />
            <span class="text-caption-bold text-primary">MEDICAL RECORDS</span>
          </div>
          <h1 class="text-h3 font-weight-bold mb-0">
            Patient Registry
          </h1>
        </div>

        <div class="d-flex align-center gap-4">
          <div style="width: 280px">
            <VTextField
              placeholder="Search by name, ID or owner..."
              density="compact"
              variant="solo"
              hide-details
              flat
              bg-color="grey-lighten-4"
              prepend-inner-icon="tabler-search"
              class="rounded-lg shadow-sm"
            />
          </div>
          <VBtn
            color="primary"
            variant="flat"
            class="rounded-lg shadow-sm px-6"
            prepend-icon="tabler-plus"
            to="/veterinary/pets/new"
          >
            New Patient
          </VBtn>
          <VBtn
            color="primary"
            variant="tonal"
            icon="tabler-refresh"
            :loading="loading"
            @click="fetchPets"
          />
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="pa-8">
        <VCard class="premium-card overflow-hidden">
          <VDataTable
            :headers="headers"
            :items="pets"
            :loading="loading"
            class="premium-table"
            hover
          >
            <template #item.name="{ item }">
              <div class="d-flex align-center py-2">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="44"
                  class="me-3 rounded-lg"
                >
                  <VIcon
                    :icon="getSpeciesIcon(item.species)"
                    size="24"
                  />
                </VAvatar>
                <div class="d-flex flex-column">
                  <span class="font-weight-bold text-h6 text-primary">{{ item.name }}</span>
                  <span class="text-caption text-medium-emphasis">
                    ID: {{ item.pet_code || 'PENDING' }}
                  </span>
                </div>
              </div>
            </template>

            <template #item.species="{ item }">
              <div class="d-flex flex-column">
                <span class="text-body-2 font-weight-bold">{{ item.species }}</span>
                <span class="text-caption text-medium-emphasis">{{ item.breed || 'Mixed Breed' }}</span>
              </div>
            </template>

            <template #item.owner.name="{ item }">
              <div class="d-flex flex-column">
                <span class="text-body-2 font-weight-medium text-high-emphasis">
                  {{ item.owner?.name || 'Walk-in' }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  <VIcon
                    icon="tabler-phone"
                    size="12"
                    class="me-1"
                  />
                  {{ item.owner?.phone || 'No phone' }}
                </span>
              </div>
            </template>

            <template #item.is_active="{ item }">
              <VChip 
                :color="item.is_active ? 'success' : 'secondary'" 
                size="x-small"
                variant="tonal"
                class="premium-badge"
                label
              >
                {{ item.is_active ? 'Active' : 'Archived' }}
              </VChip>
            </template>
          
            <template #item.actions="{ item }">
              <div class="d-flex gap-2 justify-end">
                <VBtn 
                  variant="tonal" 
                  size="small" 
                  color="primary"
                  class="rounded-lg"
                  @click="router.push(`/veterinary/pets/${item.id}`)"
                >
                  Open File
                </VBtn>
                <VMenu location="bottom end">
                  <template #activator="{ props }">
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      color="secondary"
                      v-bind="props"
                    >
                      <VIcon
                        icon="tabler-dots-vertical"
                        size="18"
                      />
                    </VBtn>
                  </template>
                  <VList
                    density="compact"
                    class="rounded-lg elevation-4"
                  >
                    <VListItem
                      title="Edit Details"
                      prepend-icon="tabler-edit"
                      @click="router.push(`/veterinary/pets/${item.id}/edit`)"
                    />
                    <VListItem
                      title="Archive Patient"
                      prepend-icon="tabler-archive"
                      color="error"
                      @click="deletePet(item.id)"
                    />
                  </VList>
                </VMenu>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </div>
    </div>
  </component>
</template>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

.premium-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03) !important;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>


