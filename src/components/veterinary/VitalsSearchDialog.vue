<script setup>
import { ref, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'selected'])

const vetStore = useVeterinaryStore()
const search = ref('')
const results = ref([])
const searching = ref(false)

const handleSearch = async () => {
  if (search.value.length < 2) {
    results.value = []
    
    return
  }
  searching.value = true
  try {
    results.value = await vetStore.searchPets(search.value, vetStore.activeClinicId)
  } catch (err) {
    console.error('Search failed:', err)
  } finally {
    searching.value = false
  }
}

// Debounce search
let timeout = null
watch(search, () => {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(handleSearch, 300)
})

const selectPet = async pet => {
  searching.value = true
  try {
    // 1. Try to find if there's already an active visit for today
    const res = await vetStore.fetchQueue('WAITING_ROOM', vetStore.activeClinicId, { pet_id: pet.id })
    let visit = res.find(v => v.pet?.id === pet.id || v.pet === pet.id)

    // 2. If no active visit, create a walk-in visit
    if (!visit) {
      visit = await vetStore.startWalkInVisit(pet.id, vetStore.activeClinicId)
    }

    // 3. Construct "pseudo-appointment" for the vitals dialog
    const aptMock = {
      id: visit.appointment_id || null,
      visit_id: visit.id,
      pet: pet.name,
      pet_details: pet,
      status: 'WAITING',
    }

    emit('selected', aptMock)
  } catch (err) {
    console.error('Failed to start vitals session:', err)
  } finally {
    searching.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard class="rounded-xl overflow-hidden">
      <VCardTitle class="pa-6 border-b bg-premium-surface d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-3">
          <VAvatar
            color="primary"
            variant="tonal"
            size="40"
          >
            <VIcon icon="tabler-search" />
          </VAvatar>
          <div class="text-h5 font-weight-black">
            Quick Vitals Search
          </div>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          density="compact"
          @click="emit('update:modelValue', false)"
        />
      </VCardTitle>

      <VCardText class="pa-6">
        <VTextField
          v-model="search"
          placeholder="Search by Pet Name or Owner phone..."
          prepend-inner-icon="tabler-search"
          variant="outlined"
          class="rounded-lg mb-4"
          hide-details
          autofocus
          :loading="searching"
        />

        <div
          class="results-list"
          style="max-height: 400px; overflow-y: auto;"
        >
          <div
            v-if="results.length === 0 && search.length >= 2 && !searching"
            class="text-center py-8 opacity-60"
          >
            No pets found matching "{{ search }}"
          </div>

          <div
            v-for="pet in results"
            :key="pet.id"
            class="pet-result-item d-flex align-center pa-3 mb-2 rounded-lg cursor-pointer transition-all"
            @click="selectPet(pet)"
          >
            <VAvatar
              size="48"
              color="primary"
              variant="tonal"
              class="me-4"
            >
              <VIcon icon="tabler-paw" />
            </VAvatar>
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-bold">
                {{ pet.name }}
              </div>
              <div class="text-caption opacity-70">
                {{ pet.species }} · {{ pet.breed || 'Unknown Breed' }}
              </div>
            </div>
            <div class="text-end">
              <VBtn
                size="small"
                variant="flat"
                color="primary"
                class="rounded-md font-weight-black text-none"
              >
                Start Vitals
              </VBtn>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.pet-result-item {
  border: 1px solid rgba(var(--v-border-color), 0.05);
  background: #F8FAFC;
}
.pet-result-item:hover {
  background: #EEF2FF;
  border-color: rgba(var(--v-primary-base), 0.2);
  transform: translateY(-1px);
}
</style>
