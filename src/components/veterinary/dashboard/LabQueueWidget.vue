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
        const data = await store.fetchQueue('LAB_QUEUE', activeClinicId.value)
        visits.value = data
    } catch (e) {
        console.error("Failed to fetch lab queue:", e)
    }
}

onMounted(() => {
    fetchQueue()
})
</script>

<template>
  <VCard title="Lab Queue (Tests Ordered)" class="mb-6 border" elevation="0">
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
          <VBtn color="info" size="small" :to="`/veterinary/visits/${item.id}/summary`">Process Labs</VBtn>
        </template>
      </VDataTable>
  </VCard>
</template>
