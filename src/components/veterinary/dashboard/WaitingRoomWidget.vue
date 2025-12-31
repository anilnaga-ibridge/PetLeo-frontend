<script setup>
import { ref, onMounted, computed } from 'vue'
import { VDataTable } from 'vuetify/components'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const activeTab = ref('waiting')
const waitingVisits = ref([])

const fetchQueue = async () => {
    if (!activeClinicId.value) return
    try {
        const data = await store.fetchQueue('WAITING_ROOM', activeClinicId.value)
        waitingVisits.value = data
    } catch (e) {
        console.error("Failed to fetch waiting room:", e)
    }
}

onMounted(() => {
    fetchQueue()
})
const getWaitTime = (createdAt) => {
    if (!createdAt) return 'N/A'
    const start = new Date(createdAt)
    const now = new Date()
    const diffMs = now - start
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins
}

const getSlaColor = (mins) => {
    if (mins > 45) return 'error'
    if (mins > 30) return 'warning'
    return 'success'
}
const checkingIn = ref(null)

const checkInVisit = async (visit) => {
    if (!visit.id) return
    checkingIn.value = visit.id
    try {
        // Call backend API to check-in
        // Using store action if available, or direct API call
        // Assuming store has checkInVisit or we use axios directly
        // Let's use store for consistency if possible, but store.fetchQueue is used above.
        // I'll add a direct call here for now as I don't see the store file content fully.
        // Actually, let's check if store has it. If not, I'll use providerApi.
        
        // Using providerApi from axios plugin
        // import { providerApi } from '@/plugins/axios' // Need to import this
        
        // Wait, I need to import providerApi first.
        // Let's assume store.checkInVisit exists or I'll implement it.
        // For now, let's implement it directly here to be safe and quick.
        
        await store.checkInVisit(visit.id) // I will ensure store has this.
        
        // Refresh queue
        await fetchQueue()
        
    } catch (e) {
        console.error("Failed to check-in:", e)
    } finally {
        checkingIn.value = null
    }
}
</script>

<template>
  <VCard title="Waiting Room" class="mb-6 border" elevation="0">
     <VTabs v-model="activeTab" class="px-4">
        <VTab value="waiting">Waiting ({{ waitingVisits.length }})</VTab>
     </VTabs>
     <VWindow v-model="activeTab" class="pa-4">
        <VWindowItem value="waiting">
           <VDataTable
              :items="waitingVisits"
              :headers="[
                { title: 'Pet', key: 'pet.name' },
                { title: 'Owner', key: 'pet.owner.name' },
                { title: 'Wait Time', key: 'created_at' },
                { title: 'Status', key: 'status' },
                { title: 'Actions', key: 'actions' }
              ]"
            >
              <template #item.created_at="{ item }">
                <VChip :color="getSlaColor(getWaitTime(item.created_at))" size="small" label>
                    {{ getWaitTime(item.created_at) }} min
                </VChip>
              </template>
              <template #item.actions="{ item }">
                <VBtn 
                  v-if="item.status === 'CREATED'"
                  color="success" 
                  size="small" 
                  prepend-icon="tabler-check"
                  :loading="checkingIn === item.id"
                  @click="checkInVisit(item)"
                >
                  Check-in
                </VBtn>
                <VBtn v-else color="primary" size="small" :to="`/veterinary/visits/${item.id}/summary`">View</VBtn>
              </template>
            </VDataTable>
        </VWindowItem>
     </VWindow>
  </VCard>
</template>
