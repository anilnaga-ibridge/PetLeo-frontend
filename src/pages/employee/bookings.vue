<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customerApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'
import BookingDetailDialog from '@/pages/provider/components/BookingDetailDialog.vue'
import ProviderLayout from '@/components/ProviderLayout.vue'

const route = useRoute()
const bookings = ref([])
const loading = ref(false)
const submitting = ref(false)
const permissionStore = usePermissionStore()

const showDetailDialog = ref(false)
const selectedBooking = ref(null)
const activeTab = ref('ALL')
const searchQuery = ref(route.query.search || '')

const tabs = [
  { title: 'All My Tasks', value: 'ALL', icon: 'tabler-layout-grid' },
  { title: 'Action Needed', value: 'PENDING', icon: 'tabler-alert-circle' },
  { title: 'Upcoming', value: 'UPCOMING', icon: 'tabler-calendar-event' },
  { title: 'Completed', value: 'COMPLETED', icon: 'tabler-check' },
]

const stats = computed(() => {
  const pending = bookings.value.filter(b => b.status === 'PENDING').length
  const today = bookings.value.filter(b => {
    const bookingDate = new Date(b.selected_time)
    const now = new Date()
    return bookingDate.toDateString() === now.toDateString() && ['CONFIRMED', 'PENDING'].includes(b.status)
  }).length
  const total = bookings.value.length

  return [
    { title: 'Pending My Approval', value: pending, icon: 'tabler-clock', color: 'warning' },
    { title: "Today's Schedule", value: today, icon: 'tabler-calendar', color: 'primary' },
    { title: 'My Total Work', value: total, icon: 'tabler-chart-bar', color: 'success' },
  ]
})

const filteredBookings = computed(() => {
  let result = bookings.value

  // Filter by Tab
  if (activeTab.value !== 'ALL') {
    if (activeTab.value === 'UPCOMING') {
      result = result.filter(b => ['CONFIRMED', 'PENDING'].includes(b.status) && new Date(b.selected_time) > new Date())
    } else {
      result = result.filter(b => b.status === activeTab.value)
    }
  }

  // Filter by Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(b => 
      b.pet_details?.name?.toLowerCase().includes(query) ||
      b.owner_details?.full_name?.toLowerCase().includes(query) ||
      b.service_name?.toLowerCase().includes(query)
    )
  }
  
  return result.sort((a, b) => new Date(b.selected_time) - new Date(a.selected_time))
})

const openDetail = (booking) => {
  selectedBooking.value = booking
  showDetailDialog.value = true
}

const fetchBookings = async () => {
  loading.value = true
  try {
    // Employees always use the default endpoint which filters by their token/auth_id
    const res = await customerApi.get('/api/pet-owner/bookings/bookings/')
    bookings.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
  } finally {
    loading.value = false
  }
}

const handleAction = async (bookingId, action, extraData = {}) => {
  submitting.value = true
  try {
    const res = await customerApi.post(`/api/pet-owner/bookings/bookings/${bookingId}/${action}/`, extraData)
    const index = bookings.value.findIndex(b => b.id === bookingId)
    if (index !== -1) {
      bookings.value[index] = res.data
    }
  } catch (err) {
    console.error(`Action ${action} failed:`, err)
  } finally {
    submitting.value = false
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'CONFIRMED': return 'primary'
    case 'COMPLETED': return 'success'
    case 'REJECTED': return 'error'
    case 'CANCELLED': return 'slate-400'
    default: return 'slate-400'
  }
}

const getPetPhoto = (pet) => {
  if (!pet?.photo) return null
  return pet.photo.startsWith('http') ? pet.photo : `http://localhost:8005${pet.photo}`
}

onMounted(fetchBookings)
</script>

<template>
  <ProviderLayout>
    <div class="employee-bookings-page pa-6 pb-16">
      <!-- Welcome Header -->
      <div class="d-flex flex-column flex-md-row justify-space-between align-md-center gap-4 mb-8">
        <div>
          <h1 class="text-h3 font-weight-black text-slate-800 tracking-tight mb-1">My Bookings</h1>
          <p class="text-subtitle-1 text-slate-500 font-weight-medium">Manage your assigned pet service tasks</p>
        </div>
            
        <div class="d-flex gap-4 align-center">
          <VTextField
            v-model="searchQuery"
            prepend-inner-icon="tabler-search"
            placeholder="Find a pet or owner..."
            density="comfortable"
            variant="solo"
            bg-color="white"
            hide-details
            class="search-input rounded-xl"
            style="min-width: 250px"
          />
          <VBtn 
            icon="tabler-refresh" 
            variant="tonal" 
            color="primary"
            class="rounded-xl glass-btn"
            :loading="loading"
            @click="fetchBookings"
          />
        </div>
      </div>

      <!-- Performance Stats -->
      <VRow class="mb-8">
        <VCol v-for="stat in stats" :key="stat.title" cols="12" md="4">
          <VCard flat class="glass-card pa-6 d-flex align-center justify-space-between border">
            <div>
              <div class="text-overline font-weight-bold text-slate-400 mb-1">{{ stat.title }}</div>
              <div class="text-h3 font-weight-black text-slate-800">{{ stat.value }}</div>
            </div>
            <VAvatar :color="stat.color" variant="tonal" size="56" rounded="xl">
              <VIcon :icon="stat.icon" size="32" />
            </VAvatar>
          </VCard>
        </VCol>
      </VRow>

      <!-- Workflow Tabs -->
      <div class="custom-tabs mb-8 overflow-x-auto d-flex gap-2 pb-2">
        <div 
          v-for="tab in tabs" 
          :key="tab.value"
          class="tab-item d-flex align-center gap-2 cursor-pointer px-6 py-3 rounded-xl transition-all border"
          :class="{ 'active': activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <VIcon :icon="tab.icon" size="20" />
          <span class="font-weight-bold">{{ tab.title }}</span>
        </div>
      </div>

      <!-- Tasks List -->
      <div v-if="loading && bookings.length === 0" class="d-flex justify-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
      </div>

      <div v-else-if="filteredBookings.length === 0" class="text-center py-16 glass-card border">
        <VIcon icon="tabler-mood-empty" size="80" color="slate-200" class="mb-6 opacity-80" />
        <h3 class="text-h4 font-weight-bold text-slate-400 mb-2">No tasks assigned</h3>
        <p class="text-body-1 text-slate-400">Your schedule is clear right now.</p>
      </div>

      <div v-else class="bookings-grid">
        <transition-group name="list">
          <div v-for="booking in filteredBookings" :key="booking.id" class="mb-4">
            <VCard 
              flat 
              class="booking-card pa-0 rounded-[24px] overflow-hidden cursor-pointer border"
              @click="openDetail(booking)"
            >
              <div class="d-flex flex-column flex-md-row">
                 <div :class="['status-strip', getStatusColor(booking.status)]"></div>

                 <div class="pa-6 d-flex flex-column flex-md-row align-center flex-grow-1 gap-6">
                    <div class="d-flex align-center gap-4 min-w-[200px]">
                      <VAvatar size="64" rounded="xl" class="elevation-2" color="white">
                        <VImg v-if="getPetPhoto(booking.pet_details)" :src="getPetPhoto(booking.pet_details)" cover />
                        <VIcon v-else icon="tabler-paw" size="28" color="slate-300" />
                      </VAvatar>
                      <div>
                        <h4 class="text-h6 font-weight-black text-slate-800 line-clamp-1">{{ booking.pet_details?.name }}</h4>
                        <div class="text-body-2 text-slate-500 font-weight-bold">
                          {{ booking.owner_details?.full_name || 'Pet Owner' }}
                        </div>
                      </div>
                    </div>

                    <div class="d-flex align-center gap-4 flex-grow-1 border-s-md pl-md-6 border-slate-100">
                       <VAvatar color="primary" variant="tonal" size="44" rounded="lg">
                          <VIcon icon="tabler-calendar-time" />
                       </VAvatar>
                       <div>
                          <div class="text-subtitle-1 font-weight-bold text-slate-800">
                             {{ new Date(booking.selected_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }}
                          </div>
                          <div class="text-caption text-slate-400 font-weight-bold text-uppercase">
                             {{ new Date(booking.selected_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }}
                          </div>
                       </div>
                    </div>

                     <div class="d-flex align-center gap-3 flex-grow-1">
                        <VAvatar color="info" variant="tonal" size="44" rounded="lg">
                           <VIcon icon="tabler-settings" />
                        </VAvatar>
                        <div>
                           <div class="text-subtitle-2 font-weight-black text-slate-700">{{ booking.service_name || 'Service' }}</div>
                           <div class="text-caption text-slate-500 font-weight-bold">Assigned to you</div>
                        </div>
                     </div>

                     <VChip 
                        :color="getStatusColor(booking.status)" 
                        variant="tonal"
                        size="small" 
                        class="font-weight-black px-4"
                      >
                        {{ booking.status }}
                      </VChip>

                     <div v-if="booking.status === 'PENDING'" class="d-flex gap-2" @click.stop>
                        <VBtn
                          icon="tabler-check"
                          color="success"
                          variant="flat"
                          size="small"
                          class="rounded-lg shadow-success-sm"
                           :loading="submitting"
                          @click="handleAction(booking.id, 'accept')"
                        />
                     </div>
                     <div v-else class="d-flex justify-end" style="width: 44px;">
                        <VIcon icon="tabler-chevron-right" color="slate-300" />
                     </div>
                 </div>
              </div>
            </VCard>
          </div>
        </transition-group>
      </div>

      <BookingDetailDialog
        v-slot:default="{ action }"
        v-model="showDetailDialog"
        :booking="selectedBooking"
        @action="(actionName) => handleAction(selectedBooking.id, actionName)"
      />
    </div>
  </ProviderLayout>
</template>

<style scoped lang="scss">
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
}

.booking-card {
  background: white;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
  }
}

.status-strip {
  width: 6px;
  &.warning { background: rgb(var(--v-theme-warning)); }
  &.primary { background: rgb(var(--v-theme-primary)); }
  &.success { background: rgb(var(--v-theme-success)); }
  &.error { background: rgb(var(--v-theme-error)); }
}

.custom-tabs .tab-item {
  &.active {
    background: rgb(var(--v-theme-primary));
    color: white;
  }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
