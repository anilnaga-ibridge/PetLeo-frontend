<script setup>
import { ref, onMounted } from 'vue'
import { customerApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'
import BookingDetailDialog from './BookingDetailDialog.vue'
import OtpValidationDialog from './OtpValidationDialog.vue'

const bookings = ref([])
const loading = ref(false)
const submitting = ref(false)
const permissionStore = usePermissionStore()

const showDetailDialog = ref(false)
const showOtpDialog = ref(false)
const selectedBooking = ref(null)
const otpError = ref('')

const openDetail = (booking) => {
  selectedBooking.value = booking
  showDetailDialog.value = true
}

const fetchBookings = async () => {
  loading.value = true
  try {
    // [FIX] Role Separation:
    // - Managers/Admins: Send provider_id to see ALL bookings for the shop.
    // - Execution Staff (Groomer/Therapist): Do NOT send provider_id. Backend defaults to "My Assigned Jobs" only.
    const isManager = permissionStore.hasCapability('PROVIDER_ADMIN')
    const providerId = permissionStore.userData?.provider_id
    
    // If manager, fetch all. If staff, fetch mine (default backend behavior when no provider_id param)
    const url = (isManager && providerId)
      ? `/api/pet-owner/bookings/bookings/?provider_id=${providerId}`
      : '/api/pet-owner/bookings/bookings/'
      
    const res = await customerApi.get(url)
    bookings.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
  } finally {
    loading.value = false
  }
}


const handleAction = async (bookingId, action, extraData = {}) => {
  if (action === 'complete') {
    // 1. Find the booking ID first (if passed via detail dialog it might just be the ID)
    const booking = bookings.value.find(b => b.id === bookingId) || selectedBooking.value
    if (!booking) return
    
    selectedBooking.value = booking
    
    // 2. Generate OTP first
    submitting.value = true
    otpError.value = ''
    try {
      const itemId = booking.item_id || booking.id // Fallback to booking ID if item_id missing (legacy)
      // Note: item_id is preferred for new logic
      // But if backend accepts items/{id}/generate_otp, we need item ID.
      // BookingSerializer now has item_id.
      
      const targetId = booking.item_id
      if (!targetId) {
        console.error("No item ID found for OTP generation")
         // Fallback legacy complete?
         await customerApi.post(`/api/pet-owner/bookings/bookings/${bookingId}/complete/`)
         const index = bookings.value.findIndex(b => b.id === bookingId)
         if (index !== -1) bookings.value[index].status = 'COMPLETED'
         submitting.value = false
         return
      }

      await customerApi.post(`/api/pet-owner/bookings/items/${targetId}/generate_otp/`)
      
      // 3. Show Dialog
      showOtpDialog.value = true
      
    } catch (err) {
      console.error(`Failed to generate OTP:`, err)
    } finally {
      submitting.value = false
    }
    return
  }

  submitting.value = true
  try {
    const providerId = permissionStore.userData?.provider_id
    const query = providerId ? `?provider_id=${providerId}` : ''
    const res = await customerApi.post(`/api/pet-owner/bookings/bookings/${bookingId}/${action}/${query}`, extraData)
    // Update local state
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

const handleOtpSubmit = async (otp) => {
  submitting.value = true
  otpError.value = ''
  try {
    const booking = selectedBooking.value
    const targetId = booking.item_id
    
    await customerApi.post(`/api/pet-owner/bookings/items/${targetId}/verify_otp/`, { otp })
    
    // Success
    showOtpDialog.value = false
    showDetailDialog.value = false // Close detail too if open
    
    // Update list
    const index = bookings.value.findIndex(b => b.id === booking.id)
    if (index !== -1) {
      bookings.value[index].status = 'COMPLETED' // Optimistic update
    }
    
  } catch (err) {
    console.error("OTP Verification failed", err)
    otpError.value = err.response?.data?.error || 'Invalid OTP. Please try again.'
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

defineExpose({ refresh: fetchBookings })
</script>

<template>
  <div class="booking-inbox">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h2 class="text-h3 font-weight-black text-slate-800 tracking-tighter">Booking Requests</h2>
        <p class="text-subtitle-1 text-slate-500 font-weight-medium">Manage your incoming service requests and active schedule.</p>
      </div>
      <VBtn 
        icon="tabler-refresh" 
        variant="tonal" 
        @click="fetchBookings" 
        :loading="loading"
        class="rounded-xl"
      />
    </div>

    <div v-if="loading && bookings.length === 0" class="d-flex justify-center py-16">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="bookings.length === 0" class="text-center py-16 bg-slate-50 rounded-[32px] border-2 border-dashed">
      <VIcon icon="tabler-calendar-off" size="64" color="slate-200" class="mb-4" />
      <h3 class="text-h5 font-weight-bold text-slate-400">No booking requests yet</h3>
      <p class="text-body-1 text-slate-400">Your upcoming appointments will appear here.</p>
    </div>

    <VRow v-else>
      <VCol v-for="booking in bookings" :key="booking.id" cols="12">
        <VCard 
          flat 
          border 
          class="booking-request-card pa-6 rounded-[32px] overflow-hidden cursor-pointer"
          @click="openDetail(booking)"
        >
          <div class="d-flex align-center justify-space-between flex-wrap gap-6">
            <!-- PET & OWNER INFO -->
            <div class="d-flex align-center gap-6">
              <VAvatar size="80" rounded="xl" class="elevation-4 shadow-sm" color="slate-50">
                <VImg v-if="getPetPhoto(booking.pet_details)" :src="getPetPhoto(booking.pet_details)" cover />
                <VIcon v-else icon="tabler-paw" size="32" color="slate-200" />
              </VAvatar>
              
              <div>
                <div class="d-flex align-center gap-2 mb-1">
                  <h4 class="text-h4 font-weight-black text-slate-900">{{ booking.pet_details?.name }}</h4>
                  <VChip :color="getStatusColor(booking.status)" size="x-small" variant="flat" class="font-weight-black">
                    {{ booking.status }}
                  </VChip>
                </div>
                <div class="text-subtitle-1 text-slate-500 font-weight-bold opacity-80">
                  <VIcon icon="tabler-user" size="16" class="mr-1" />
                  {{ booking.owner_details?.full_name || 'Pet Owner' }}
                </div>
              </div>
            </div>

            <!-- BOOKING DETAILS -->
            <div class="d-flex align-center gap-8 flex-grow-1 px-8 border-s border-e mx-4 border-slate-100">
              <div>
                <div class="label-tiny uppercase mb-1">Schedule</div>
                <div class="text-subtitle-1 font-weight-black text-slate-700">
                  {{ new Date(booking.selected_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </div>
                <div class="text-body-2 font-weight-bold text-slate-400">
                  {{ new Date(booking.selected_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
              
              <div>
                <div class="label-tiny uppercase mb-1">Service Type</div>
                <div class="text-subtitle-1 font-weight-black text-primary">
                  {{ booking.service_name || 'Service Request' }}
                </div>
                <div class="text-body-2 font-weight-bold text-slate-400">
                  {{ booking.address_snapshot?.city || 'In-House' }}
                </div>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="d-flex align-center gap-3">
              <template v-if="booking.status === 'PENDING'">
                <VBtn
                  color="error"
                  variant="tonal"
                  height="54"
                  class="rounded-2xl px-6 font-weight-black"
                  @click="handleAction(booking.id, 'reject', { rejection_reason: 'Unavailable at this time' })"
                  :loading="submitting"
                >
                  Reject
                </VBtn>
                <VBtn
                  color="primary"
                  height="54"
                  class="rounded-2xl px-10 font-weight-black shadow-primary"
                  @click="handleAction(booking.id, 'accept')"
                  :loading="submitting"
                >
                  Accept Request
                </VBtn>
              </template>
              
              <template v-else-if="booking.status === 'CONFIRMED'">
                <VBtn
                  color="success"
                  height="54"
                  class="rounded-2xl px-10 font-weight-black shadow-success"
                  prepend-icon="tabler-check"
                  @click="handleAction(booking.id, 'complete')"
                  :loading="submitting"
                >
                  Mark Completed
                </VBtn>
              </template>
              
              <VBtn
                v-else
                variant="outlined"
                color="slate-300"
                height="54"
                class="rounded-2xl px-6 font-weight-black opacity-50"
                disabled
              >
                No Actions
              </VBtn>
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <BookingDetailDialog
      v-model="showDetailDialog"
      :booking="selectedBooking"
      @action="(action) => handleAction(selectedBooking.id, action)"
    />

    <OtpValidationDialog
      v-model="showOtpDialog"
      :loading="submitting"
      :error="otpError"
      @submit="handleOtpSubmit"
      @resend="() => handleAction(selectedBooking.id, 'complete')"
    />
  </div>
</template>

<style scoped>
.booking-request-card {
  background: white;
  transition: all 0.3s ease;
  border-color: #f1f5f9 !important;
}

.booking-request-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.06) !important;
  border-color: #e2e8f0 !important;
}

.label-tiny {
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: #94a3b8;
}

.shadow-primary {
  box-shadow: 0 10px 25px rgba(var(--v-theme-primary), 0.2) !important;
}

.shadow-success {
  box-shadow: 0 10px 25px rgba(var(--v-theme-success), 0.2) !important;
}

@media (max-width: 960px) {
  .border-s, .border-e {
    border: none !important;
    margin: 16px 0 !important;
    padding: 0 !important;
  }
}
</style>
