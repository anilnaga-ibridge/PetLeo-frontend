<script setup>
import { ref, onMounted, computed } from 'vue'
import { VDataTable } from 'vuetify/components'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const visits = ref([])

const fetchQueue = async () => {
    if (!activeClinicId.value) return
    try {
        const data = await store.fetchQueue('DOCTOR_QUEUE', activeClinicId.value)
        visits.value = data
    } catch (e) {
        console.error("Failed to fetch doctor queue:", e)
    }
}

onMounted(() => {
    fetchQueue()
})
</script>

<template>
  <VCard title="My Patients (Ready for Consult)" class="mb-6 border" elevation="0">
     <VDataTable
        :items="visits"
        :headers="[
          { title: 'Pet', key: 'pet.name' },
          { title: 'Owner', key: 'pet.owner.name' },
          { title: 'Status', key: 'status' },
          { title: 'Actions', key: 'actions' }
        ]"
      >
        <template #item.actions="{ item }">
          <VBtn color="primary" size="small" :to="`/veterinary/visits/${item.id}/summary`">Consult</VBtn>
        </template>
      </VDataTable>
  </VCard>
</template>
