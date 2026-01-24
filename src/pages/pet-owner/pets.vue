<script setup>
import { ref, onMounted } from 'vue'
import PetOwnerLayout from '@/layouts/PetOwnerLayout.vue'
import axios from 'axios'

const pets = ref([])
const loading = ref(true)

const fetchPets = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://127.0.0.1:8001/api/pet-owner/pets/')

    pets.value = res.data
  } catch (err) {
    console.error('Failed to fetch pets', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPets)
</script>

<template>
  <PetOwnerLayout>
    <div class="pets-container">
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">
          My Pets
        </h1>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          disabled
        >
          Add Pet
        </VBtn>
      </div>

      <div
        v-if="loading"
        class="d-flex justify-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="64"
        />
      </div>

      <div
        v-else-if="pets.length === 0"
        class="text-center py-12 bg-white rounded-xl border border-dashed"
      >
        <VIcon
          icon="tabler-paw"
          size="64"
          color="medium-emphasis"
          class="mb-4"
        />
        <h2 class="text-h5 font-weight-bold mb-2">
          No Pets Found
        </h2>
        <p class="text-medium-emphasis mb-6">
          You haven't registered any pets yet.
        </p>
        <VBtn
          color="primary"
          variant="flat"
        >
          Register First Pet
        </VBtn>
      </div>

      <VRow v-else>
        <VCol
          v-for="pet in pets"
          :key="pet.id"
          cols="12"
          sm="6"
          md="4"
        >
          <VCard class="rounded-xl elevation-2 overflow-hidden">
            <VImg
              :src="pet.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'"
              height="200"
              cover
            >
              <div class="d-flex flex-column justify-end fill-height pa-4 bg-gradient-bottom">
                <div class="text-h5 font-weight-bold text-white">
                  {{ pet.name }}
                </div>
                <div class="text-subtitle-2 text-white opacity-90">
                  {{ pet.breed || pet.species }}
                </div>
              </div>
            </VImg>
            <VCardText class="pa-4">
              <div class="d-flex align-center gap-4 mb-4">
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">
                    Age
                  </div>
                  <div class="text-body-1 font-weight-bold">
                    {{ pet.age || 'Unknown' }} years
                  </div>
                </div>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">
                    Gender
                  </div>
                  <div class="text-body-1 font-weight-bold">
                    {{ pet.gender || 'Unknown' }}
                  </div>
                </div>
              </div>
              <VBtn
                block
                color="primary"
                variant="tonal"
                class="rounded-lg"
              >
                View Health Records
              </VBtn>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </PetOwnerLayout>
</template>

<style scoped>
.pets-container {
  max-width: 1000px;
  margin: 0 auto;
}

.bg-gradient-bottom {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}
</style>
