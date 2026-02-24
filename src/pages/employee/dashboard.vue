<script setup>
import { onMounted, computed, ref } from 'vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { customerApi } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'

const permissionStore = usePermissionStore()
const userData = computed(() => permissionStore.userData || {})
const bookings = ref([])
const loading = ref(false)

const fetchMyBookings = async () => {
  loading.value = true
  try {
    // Fetch only bookings assigned to this provider/employee
    const res = await customerApi.get('/api/pet-owner/bookings/bookings/')
    bookings.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await permissionStore.fetchPermissions()
  fetchMyBookings()
})

const stats = computed(() => {
  const active = bookings.value.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length
  const completed = bookings.value.filter(b => b.status === 'COMPLETED').length
  return { active, completed }
})

const todayBookings = computed(() => {
  return bookings.value.filter(b => b.status === 'PENDING')
})
</script>

<template>
  <ProviderLayout>
    <div class="pa-6 employee-dashboard">
      <!-- WELCOME SECTION -->
      <div class="mb-8">
        <h1 class="text-h2 font-weight-bold mb-1">
          Hello, <span class="text-primary">{{ userData.fullName?.split(' ')[0] || 'Employee' }}</span>! 🐾
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          You have <span class="text-primary font-weight-bold">{{ todayBookings.length }}</span> new requests waiting for your action.
        </p>
      </div>

      <VRow>
        <!-- STATS ROW -->
        <VCol cols="12" md="4">
          <VCard color="primary" class="stats-card">
            <VCardText class="d-flex align-center pa-6">
              <VAvatar color="white" variant="flat" size="48" class="me-4">
                <VIcon icon="tabler-calendar-time" color="primary" />
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold text-white">{{ stats.active }}</div>
                <div class="text-body-2 text-white opacity-80">Active Bookings</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        
        <VCol cols="12" md="4">
          <VCard color="success" class="stats-card">
            <VCardText class="d-flex align-center pa-6">
              <VAvatar color="white" variant="flat" size="48" class="me-4">
                <VIcon icon="tabler-check" color="success" />
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold text-white">{{ stats.completed }}</div>
                <div class="text-body-2 text-white opacity-80">Completed Today</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="4">
          <VCard color="amber-darken-3" class="stats-card">
            <VCardText class="d-flex align-center pa-6">
              <VAvatar color="white" variant="flat" size="48" class="me-4">
                <VIcon icon="tabler-star-filled" color="amber-darken-3" />
              </VAvatar>
              <div>
                <div class="text-h4 font-weight-bold text-white">{{ (userData.average_rating || 0).toFixed(1) }}</div>
                <div class="text-body-2 text-white opacity-80">{{ userData.total_ratings || 0 }} Reviews</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- MAIN TASKS SECTION -->
        <VCol cols="12" md="8">
          <VCard class="h-100">
            <VCardItem>
              <template #prepend>
                <VIcon icon="tabler-alert-circle" color="warning" size="24" class="me-2" />
              </template>
              <VCardTitle>New Requests</VCardTitle>
              <template #append>
                <VBtn variant="text" color="primary" :to="{ name: 'employee-bookings' }">
                  View All Schedule
                </VBtn>
              </template>
            </VCardItem>

            <VCardText>
              <div v-if="loading" class="text-center py-6">
                <VProgressCircular indeterminate color="primary" />
              </div>
              
              <div v-else-if="todayBookings.length > 0">
                <VList lines="two">
                  <VListItem
                    v-for="booking in todayBookings"
                    :key="booking.id"
                    class="booking-item mb-2 rounded-lg border"
                    :to="{ name: 'employee-bookings', query: { search: booking.id } }"
                  >
                    <template #prepend>
                      <VAvatar size="48" color="primary" variant="tonal" rounded="lg">
                        <VIcon icon="tabler-paw" size="24" />
                      </VAvatar>
                    </template>
                    
                    <VListItemTitle class="font-weight-bold">
                      {{ booking.pet_details?.name || 'Pet' }} ({{ booking.owner_details?.full_name || 'Owner' }})
                    </VListItemTitle>
                    <VListItemSubtitle>
                      {{ booking.service_name }} • {{ new Date(booking.selected_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                    </VListItemSubtitle>

                    <template #append>
                      <VChip color="warning" size="small">
                        NEW
                      </VChip>
                    </template>
                  </VListItem>
                </VList>
              </div>

              <div v-else class="text-center py-12">
                <VIcon icon="tabler-circle-check" size="48" class="text-success mb-3" />
                <h3 class="text-h6 font-weight-bold">All caught up!</h3>
                <p class="text-body-2 text-medium-emphasis">No new pending requests.</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- QUICK LINKS / HELP -->
        <VCol cols="12" md="4">
          <VCard class="mb-4">
            <VCardItem>
              <VCardTitle>Quick Actions</VCardTitle>
            </VCardItem>
            <VCardText class="d-flex flex-column gap-3">
              <VBtn block variant="tonal" prepend-icon="tabler-user-edit" to="/employee/profile">
                My Profile
              </VBtn>
              <VBtn block variant="tonal" prepend-icon="tabler-clock" :to="{ name: 'provider-availability' }">
                Set Work Hours
              </VBtn>
              <VBtn block variant="tonal" prepend-icon="tabler-help" :to="{ name: 'provider-faq' }">
                Employee Handbook
              </VBtn>
            </VCardText>
          </VCard>

          <VCard variant="tonal" color="info">
            <VCardText class="pa-4">
              <div class="d-flex align-center gap-3 mb-2">
                <VIcon icon="tabler-info-circle" />
                <span class="font-weight-bold">Booking Flow</span>
              </div>
              <p class="text-caption mb-0">
                When a new spa booking arrives in your free time, it will appear here. You can accept or complete it directly from the schedule.
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </ProviderLayout>
</template>

<style scoped>
.stats-card {
  transition: transform 0.2s ease;
}
.stats-card:hover {
  transform: translateY(-4px);
}
.booking-item {
  transition: all 0.2s ease;
}
.booking-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
