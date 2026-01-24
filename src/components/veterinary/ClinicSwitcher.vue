<script setup>
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')

const clinics = ref([])
const loading = ref(false)

const activeClinicId = computed({
  get: () => store.activeClinicId,
  set: val => {
    store.setActiveClinic(val)

    // Reload page to refresh all data context or emit event
    window.location.reload()
  },
})

const fetchClinics = async () => {
  loading.value = true
  try {
    const data = await store.fetchClinics()

    clinics.value = data
        
    // If we have an activeClinicId but it's not in the list, clear it
    if (store.activeClinicId && !data.find(c => c.id === store.activeClinicId)) {
      // But only if we are an Org. Staff have their own logic in middleware
      // For now, let's just keep it simple.
    }
  } catch (e) {
    console.error("Failed to fetch clinics for switcher:", e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchClinics)

const currentClinicName = computed(() => {
  return clinics.value.find(c => c.id === activeClinicId.value)?.name || 'Select Clinic'
})
</script>

<template>
  <div class="clinic-switcher ms-4">
    <VMenu offset="10">
      <template #activator="{ props }">
        <VBtn
          variant="tonal"
          color="primary"
          v-bind="props"
          class="rounded-pill px-4"
          :loading="loading"
        >
          <VIcon
            icon="tabler-building-hospital"
            start
            size="20"
          />
          <span class="d-none d-sm-inline">{{ currentClinicName }}</span>
          <VIcon
            icon="tabler-chevron-down"
            end
            size="16"
          />
        </VBtn>
      </template>

      <VList
        width="250"
        class="pa-2"
      >
        <VListSubheader class="text-uppercase text-caption font-weight-bold">
          Select Active Clinic
        </VListSubheader>
        
        <VListItem
          v-for="clinic in clinics"
          :key="clinic.id"
          :value="clinic.id"
          :active="activeClinicId === clinic.id"
          color="primary"
          class="rounded-lg mb-1"
          @click="activeClinicId = clinic.id"
        >
          <template #prepend>
            <VAvatar
              size="32"
              :color="activeClinicId === clinic.id ? 'primary' : 'secondary'"
              variant="tonal"
            >
              <VIcon
                icon="tabler-building"
                size="18"
              />
            </VAvatar>
          </template>
          
          <VListItemTitle class="font-weight-medium">
            {{ clinic.name }}
          </VListItemTitle>
          <VListItemSubtitle class="text-caption">
            {{ clinic.address || 'No address' }}
          </VListItemSubtitle>
          
          <template
            v-if="activeClinicId === clinic.id"
            #append
          >
            <VIcon
              icon="tabler-check"
              color="primary"
              size="18"
            />
          </template>
        </VListItem>

        <VDivider class="my-2" />
        
        <div class="pa-2">
          <p class="text-caption text-medium-emphasis mb-0">
            <VIcon
              icon="tabler-info-circle"
              size="14"
              class="me-1"
            />
            Actions are locked to the selected clinic.
          </p>
        </div>
      </VList>
    </VMenu>
  </div>
</template>

<style scoped>
.clinic-switcher {
    transition: all 0.2s ease;
}
</style>
