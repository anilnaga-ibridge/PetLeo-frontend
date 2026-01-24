<script setup>
import { ref, onMounted } from 'vue'
import PetOwnerLayout from '@/layouts/PetOwnerLayout.vue'
import axios from 'axios'

const userData = JSON.parse(localStorage.getItem('userData') || '{}')
const pets = ref([])
const recentVisits = ref([])
const unpaidInvoices = ref([])
const loading = ref(true)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    // Note: Using the pet-owner specific endpoints we created earlier
    const [petsRes, visitsRes] = await Promise.all([
      axios.get('http://127.0.0.1:8001/api/pet-owner/pets/'),
      axios.get('http://127.0.0.1:8001/api/pet-owner/visits/'),
    ])
    
    pets.value = petsRes.data
    recentVisits.value = visitsRes.data.slice(0, 3)
    
    // Filter unpaid invoices from visits
    unpaidInvoices.value = visitsRes.data
      .filter(v => v.invoice && v.invoice.status === 'DRAFT')
      .map(v => ({ ...v.invoice, visit_id: v.id, pet_name: v.pet_name }))
      
  } catch (err) {
    console.error('Failed to fetch dashboard data', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboardData)
</script>

<template>
  <PetOwnerLayout>
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold mb-1">
          Hello, {{ userData.full_name || 'Pet Parent' }}! 👋
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Welcome back to PetLeo. Here's what's happening with your pets.
        </p>
      </div>

      <!-- Quick Actions -->
      <VRow class="mb-6">
        <VCol
          cols="6"
          sm="3"
        >
          <VCard
            to="/pet-owner/pets"
            class="text-center pa-4 rounded-xl elevation-2 hover-card"
          >
            <VAvatar
              color="primary-lighten-5"
              size="56"
              class="mb-2"
            >
              <VIcon
                icon="tabler-paw"
                color="primary"
                size="32"
              />
            </VAvatar>
            <div class="text-subtitle-2 font-weight-bold">
              My Pets
            </div>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          sm="3"
        >
          <VCard
            to="/pet-owner/visits"
            class="text-center pa-4 rounded-xl elevation-2 hover-card"
          >
            <VAvatar
              color="info-lighten-5"
              size="56"
              class="mb-2"
            >
              <VIcon
                icon="tabler-calendar-event"
                color="info"
                size="32"
              />
            </VAvatar>
            <div class="text-subtitle-2 font-weight-bold">
              Visits
            </div>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          sm="3"
        >
          <VCard class="text-center pa-4 rounded-xl elevation-2 hover-card opacity-50">
            <VAvatar
              color="success-lighten-5"
              size="56"
              class="mb-2"
            >
              <VIcon
                icon="tabler-plus"
                color="success"
                size="32"
              />
            </VAvatar>
            <div class="text-subtitle-2 font-weight-bold">
              Book
            </div>
          </VCard>
        </VCol>
        <VCol
          cols="6"
          sm="3"
        >
          <VCard
            to="/pet-owner/profile"
            class="text-center pa-4 rounded-xl elevation-2 hover-card"
          >
            <VAvatar
              color="warning-lighten-5"
              size="56"
              class="mb-2"
            >
              <VIcon
                icon="tabler-settings"
                color="warning"
                size="32"
              />
            </VAvatar>
            <div class="text-subtitle-2 font-weight-bold">
              Settings
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Unpaid Invoices Alert -->
      <VAlert
        v-if="unpaidInvoices.length > 0"
        type="warning"
        variant="tonal"
        class="mb-6 rounded-xl border-warning border-opacity-25"
        icon="tabler-receipt-2"
      >
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div>
            <div class="font-weight-bold">
              Pending Payments
            </div>
            <div class="text-caption">
              You have {{ unpaidInvoices.length }} unpaid invoices.
            </div>
          </div>
          <VBtn
            color="warning"
            size="small"
            variant="flat"
            to="/pet-owner/visits"
          >
            Pay Now
          </VBtn>
        </div>
      </VAlert>

      <!-- My Pets Section -->
      <div class="mb-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5 font-weight-bold">
            My Pets
          </h2>
          <VBtn
            variant="text"
            color="primary"
            to="/pet-owner/pets"
          >
            View All
          </VBtn>
        </div>
        
        <div
          v-if="loading"
          class="d-flex gap-4 overflow-x-auto pb-2"
        >
          <VSkeletonLoader
            v-for="i in 2"
            :key="i"
            width="200"
            height="120"
            class="rounded-xl"
          />
        </div>
        
        <div
          v-else-if="pets.length === 0"
          class="text-center py-8 bg-white rounded-xl border border-dashed"
        >
          <VIcon
            icon="tabler-paw"
            size="48"
            color="medium-emphasis"
            class="mb-2"
          />
          <p class="text-medium-emphasis">
            No pets registered yet.
          </p>
        </div>

        <div
          v-else
          class="d-flex gap-4 overflow-x-auto pb-2"
        >
          <VCard
            v-for="pet in pets"
            :key="pet.id"
            width="200"
            class="rounded-xl elevation-2 flex-shrink-0"
          >
            <VImg
              :src="pet.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'"
              height="100"
              cover
            />
            <VCardText class="pa-3">
              <div class="font-weight-bold text-truncate">
                {{ pet.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ pet.breed || pet.species }}
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- Recent Visits Section -->
      <div>
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5 font-weight-bold">
            Recent Visits
          </h2>
          <VBtn
            variant="text"
            color="primary"
            to="/pet-owner/visits"
          >
            History
          </VBtn>
        </div>

        <div v-if="loading">
          <VSkeletonLoader
            v-for="i in 2"
            :key="i"
            type="list-item-avatar-two-line"
            class="mb-2"
          />
        </div>

        <div
          v-else-if="recentVisits.length === 0"
          class="text-center py-8 bg-white rounded-xl border border-dashed"
        >
          <p class="text-medium-emphasis">
            No recent visits.
          </p>
        </div>

        <div v-else>
          <VCard
            v-for="visit in recentVisits"
            :key="visit.id"
            class="mb-3 rounded-xl elevation-1"
            :to="`/pet-owner/visits/${visit.id}`"
          >
            <VListItem class="pa-4">
              <template #prepend>
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="48"
                >
                  <VIcon icon="tabler-calendar-event" />
                </VAvatar>
              </template>
              
              <VListItemTitle class="font-weight-bold">
                {{ visit.pet_name }}'s Visit
              </VListItemTitle>
              <VListItemSubtitle>
                {{ new Date(visit.created_at).toLocaleDateString() }} • {{ visit.status }}
              </VListItemSubtitle>

              <template #append>
                <VIcon
                  icon="tabler-chevron-right"
                  color="medium-emphasis"
                />
              </template>
            </VListItem>
          </VCard>
        </div>
      </div>
    </div>
  </PetOwnerLayout>
</template>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 0 auto;
}

.hover-card {
  transition: transform 0.2s ease;
  cursor: pointer;
}

.hover-card:hover {
  transform: translateY(-4px);
}

.overflow-x-auto {
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

.overflow-x-auto::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}
</style>
