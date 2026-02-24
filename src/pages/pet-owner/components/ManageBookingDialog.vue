<script setup>
import { ref, watch, computed } from 'vue'
import { customerApi, providerApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  booking: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'cancelled'])

const loading = ref(false)
const cancelling = ref(false)
const notes = ref('')

const selected_date = ref('')
const selected_time = ref('')
const availableSlots = ref([])
const slotsLoading = ref(false)

const fetchSlots = async () => {
  if (!selected_date.value || !props.booking?.provider_id) return
  slotsLoading.value = true
  try {
    const res = await providerApi.get(`/api/provider/availability/${props.booking.provider_id}/available-slots/?date=${selected_date.value}`)
    availableSlots.value = res.data.slots
  } catch (err) {
    console.error('Failed to fetch slots:', err)
  } finally {
    slotsLoading.value = false
  }
}

watch(() => props.booking, (newBooking) => {
  if (newBooking) {
    notes.value = newBooking.notes || ''
    if (newBooking.selected_time) {
      const dt = new Date(newBooking.selected_time)
      selected_date.value = dt.toISOString().split('T')[0]
      selected_time.value = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      fetchSlots()
    }
  }
}, { immediate: true })

watch(selected_date, fetchSlots)

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED': return 'success'
    case 'PENDING': return 'warning'
    case 'CANCELLED': return 'error'
    case 'COMPLETED': return 'primary'
    default: return 'slate'
  }
}

const handleUpdate = async () => {
  if (!props.booking) return
  loading.value = true
  try {
    const payload = {
      notes: notes.value,
      selected_time: `${selected_date.value}T${selected_time.value}:00Z`
    }
    
    await customerApi.patch(`/api/pet-owner/bookings/bookings/${props.booking.id}/`, payload)
    emit('saved', 'Booking updated successfully! ✨')
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Failed to update booking:', err)
    alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update booking. Please try again.')
  } finally {
    loading.value = false
  }
}

const handleCancel = async () => {
  if (!props.booking) return
  if (!confirm('Are you sure you want to cancel this booking?')) return
  
  cancelling.value = true
  try {
    await customerApi.post(`/api/pet-owner/bookings/bookings/${props.booking.id}/cancel/`)
    emit('cancelled', 'Booking cancelled successfully.')
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Failed to cancel booking:', err)
    alert(err.response?.data?.error || 'Failed to cancel booking. Please try again.')
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard class="rounded-xl overflow-hidden glass-card" v-if="booking">
      <div class="pa-8 pb-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h4 font-weight-black text-slate-900">Manage Booking</h2>
          <VBtn icon="tabler-x" variant="text" @click="emit('update:modelValue', false)" />
        </div>
        
        <div class="d-flex align-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
           <VAvatar size="48" color="primary-lighten-5">
             <VIcon icon="tabler-calendar-heart" color="primary" />
           </VAvatar>
           <div>
             <div class="text-h6 font-weight-black text-slate-800">{{ booking.provider_name || 'Service Provider' }}</div>
             <div class="text-body-2 text-slate-500">{{ booking.service_name || 'Veterinary Consultation' }}</div>
           </div>
        </div>
      </div>

      <VCardText class="pa-8 pt-0">
        <!-- Status & Type Header -->
        <div class="d-flex align-center justify-space-between mb-8">
          <div>
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-1 d-block">Status</label>
            <VChip :color="getStatusColor(booking.status)" size="small" variant="flat" class="font-weight-black px-4">
              {{ booking.status }}
            </VChip>
          </div>
          <div class="text-right">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-1 d-block">Pet</label>
            <div class="text-body-1 font-weight-bold text-slate-700">{{ booking.pet_name || 'Pet' }}</div>
          </div>
        </div>

        <!-- Date Selection -->
        <div class="mb-6">
          <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Change Date</label>
          <VTextField
            v-model="selected_date"
            type="date"
            variant="outlined"
            class="luxury-input"
            :disabled="booking.status === 'CANCELLED' || booking.status === 'COMPLETED'"
          />
        </div>

        <!-- Slot Selection -->
        <div class="mb-8">
          <label class="text-caption font-weight-black text-slate-400 uppercase mb-4 d-block">Select Time</label>
          <div v-if="slotsLoading" class="d-flex justify-center py-4">
            <VProgressCircular indeterminate size="24" color="primary" />
          </div>
          <div v-else-if="availableSlots.length === 0" class="text-center py-6 bg-slate-50 rounded-xl border-2 border-dashed">
            <VIcon icon="tabler-calendar-x" color="slate-300" size="32" class="mb-2" />
            <p class="text-caption text-slate-400 mb-0 font-weight-bold">No slots available</p>
          </div>
          <div v-else class="slot-container">
            <VChipGroup v-model="selected_time" mandatory selected-class="bg-primary text-white">
              <VChip
                v-for="slot in availableSlots"
                :key="slot"
                :value="slot"
                variant="tonal"
                class="ma-1 font-weight-black px-4"
                size="large"
              >
                {{ slot }}
              </VChip>
            </VChipGroup>
          </div>
        </div>

        <div class="mb-8">
           <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Update Notes</label>
           <VTextarea
             v-model="notes"
             placeholder="Any updates for the provider?"
             variant="outlined"
             rows="3"
             class="luxury-input"
             hide-details
             :disabled="booking.status === 'CANCELLED' || booking.status === 'COMPLETED'"
           />
        </div>

        <div v-if="booking.rejection_reason" class="pa-4 bg-error-lighten-5 rounded-xl border border-error-lighten-4 mb-8">
          <div class="text-caption font-weight-black text-error uppercase mb-1">Rejection Reason</div>
          <p class="text-body-2 text-error-darken-1 mb-0">{{ booking.rejection_reason }}</p>
        </div>
      </VCardText>

      <div class="pa-8 pt-0">
        <VBtn
          block
          color="primary"
          size="large"
          height="56"
          class="rounded-xl font-weight-black mb-4"
          :loading="loading"
          @click="handleUpdate"
          :disabled="booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'COMPLETED'"
        >
          Update Booking
        </VBtn>
        
        <VBtn
          v-if="booking.status === 'PENDING' || booking.status === 'CONFIRMED'"
          block
          variant="tonal"
          color="error"
          size="large"
          height="56"
          class="rounded-xl font-weight-black"
          :loading="cancelling"
          @click="handleCancel"
        >
          Cancel Appointment
        </VBtn>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
}

.luxury-input :deep(.v-field) {
  border-radius: 16px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}

.luxury-input :deep(.v-field--focused) {
  border-color: var(--v-theme-primary) !important;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1) !important;
}
</style>
