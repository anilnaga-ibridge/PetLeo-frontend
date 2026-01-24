<script setup>
import { ref, onMounted, computed } from 'vue'
import { VDataTable } from 'vuetify/components'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const visits = ref([])
const showEditDialog = ref(false)
const selectedVisit = ref(null)

const fetchQueue = async () => {
  if (!activeClinicId.value) return
  try {
    const data = await store.fetchQueue('LAB_QUEUE', activeClinicId.value)

    visits.value = data
  } catch (e) {
    console.error("Failed to fetch lab queue:", e)
  }
}

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

onMounted(() => {
  fetchQueue()
})
</script>

<template>
  <VCard
    title="Lab Queue (Tests Ordered)"
    class="mb-6 border"
    elevation="0"
  >
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
        <div class="d-flex gap-2 align-center">
          <VBtn
            color="info"
            size="small"
            variant="tonal"
            :to="`/veterinary/visits/${item.id}/summary`"
          >
            Process Labs
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
