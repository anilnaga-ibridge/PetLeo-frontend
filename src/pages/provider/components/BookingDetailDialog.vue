<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  booking: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'action'])

const getStatusColor = status => {
  switch (status?.toUpperCase()) {
  case 'CONFIRMED': return 'success'
  case 'PENDING': return 'warning'
  case 'CANCELLED': return 'error'
  case 'COMPLETED': return 'primary'
  default: return 'slate'
  }
}

const formattedTime = computed(() => {
  if (!props.booking?.selected_time) return ''
  
  return new Date(props.booking.selected_time).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const formattedCompletedTime = computed(() => {
  if (!props.booking?.completed_at) return ''
  
  return new Date(props.booking.completed_at).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const getPetPhoto = pet => {
  if (!pet?.photo) return null
  
  return pet.photo.startsWith('http') ? pet.photo : `http://localhost:8005${pet.photo}`
}

const handleAction = action => {
  emit('action', action)
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="800"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard
      v-if="booking"
      class="booking-detail-dialog rounded-[40px] overflow-hidden glass-card"
      border
    >
      <!-- Header -->
      <div class="pa-6 pb-0 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-3">
          <div
            class="status-indicator"
            :class="booking.status?.toLowerCase()"
          />
          <h2 class="text-h4 font-weight-black text-slate-900">
            Booking Details
          </h2>
          <VChip
            :color="getStatusColor(booking.status)"
            size="small"
            class="font-weight-black px-4"
            variant="tonal"
          >
            {{ booking.status }}
          </VChip>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          color="slate-400"
          @click="emit('update:modelValue', false)"
        />
      </div>

      <VCardText class="pa-6">
        <VRow>
          <!-- Left Column: Pet & Owner Info -->
          <VCol
            cols="12"
            md="7"
          >
            <!-- Pet Section -->
            <div class="info-section mb-8">
              <div class="d-flex align-center gap-4 mb-4">
                <VAvatar
                  size="80"
                  rounded="24"
                  class="elevation-4 shadow-sm"
                  color="primary-lighten-5"
                >
                  <VImg
                    v-if="getPetPhoto(booking.pet_details)"
                    :src="getPetPhoto(booking.pet_details)"
                    cover
                  />
                  <VIcon
                    v-else
                    icon="tabler-paw"
                    size="40"
                    color="primary"
                  />
                </VAvatar>
                <div>
                  <div class="text-overline font-weight-black text-primary mb-1">
                    PET INFORMATION
                  </div>
                  <h3 class="text-h3 font-weight-black text-slate-800">
                    {{ booking.pet_details?.name }}
                  </h3>
                  <div class="text-body-1 text-slate-500 font-weight-medium">
                    {{ booking.pet_details?.breed }} • {{ booking.pet_details?.age_display }}
                  </div>
                </div>
              </div>

              <div class="grid-details">
                <div class="detail-item">
                  <span class="label">Gender</span>
                  <span class="value">{{ booking.pet_details?.gender || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Weight</span>
                  <span class="value">{{ booking.pet_details?.weight_kg ? `${booking.pet_details.weight_kg} kg` : 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Blood Group</span>
                  <span class="value">{{ booking.pet_details?.blood_group || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Owner Section -->
            <div class="info-section">
              <div class="text-overline font-weight-black text-primary mb-4">
                OWNER INFORMATION
              </div>
              
              <div class="d-flex align-center gap-4 mb-6">
                <VAvatar
                  size="48"
                  color="success-lighten-5"
                >
                  <VIcon
                    icon="tabler-user"
                    color="success"
                  />
                </VAvatar>
                <div>
                  <h4 class="text-h5 font-weight-bold text-slate-800">
                    {{ booking.owner_details?.full_name }}
                  </h4>
                  <div class="text-body-2 text-slate-500">
                    Pet Parent
                  </div>
                </div>
              </div>

              <div class="contact-card pa-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                <div class="d-flex align-center gap-3 mb-3">
                  <VIcon
                    icon="tabler-phone"
                    size="20"
                    color="slate-400"
                  />
                  <span class="text-body-1 font-weight-bold text-slate-700">{{ booking.owner_details?.phone_number || 'No phone number' }}</span>
                </div>
                <div class="d-flex align-center gap-3 mb-3">
                  <VIcon
                    icon="tabler-mail"
                    size="20"
                    color="slate-400"
                  />
                  <span class="text-body-1 font-weight-bold text-slate-700">{{ booking.owner_details?.email || 'No email provided' }}</span>
                </div>
                <div class="d-flex align-start gap-3">
                  <VIcon
                    icon="tabler-map-pin"
                    size="20"
                    color="slate-400"
                    class="mt-1"
                  />
                  <div>
                    <div class="text-body-1 font-weight-bold text-slate-700">
                      {{ booking.address_snapshot?.address_line1 || 'In-Clinic Service' }}
                    </div>
                    <div class="text-body-2 text-slate-400">
                      {{ booking.address_snapshot?.city }}, {{ booking.address_snapshot?.state }} {{ booking.address_snapshot?.pincode }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VCol>

          <!-- Right Column: Booking Details -->
          <VCol
            cols="12"
            md="5"
          >
            <div class="schedule-card pa-6 rounded-[32px] bg-primary-lighten-5 border-2 border-primary-lighten-4 h-100">
              <div class="text-overline font-weight-black text-primary mb-6">
                SCHEDULE & SERVICE
              </div>
              
              <div class="mb-6">
                <div class="d-flex align-center gap-3 mb-2">
                  <VIcon
                    icon="tabler-calendar-event"
                    color="primary"
                  />
                  <span class="text-subtitle-1 font-weight-black text-slate-800">Appointment Time</span>
                </div>
                <div class="text-h5 font-weight-bold text-primary pl-9 mb-6">
                  {{ formattedTime }}
                </div>

                <template v-if="booking.status === 'COMPLETED' && formattedCompletedTime">
                  <div class="d-flex align-center gap-3 mb-2">
                    <VIcon
                      icon="tabler-circle-check"
                      color="success"
                    />
                    <span class="text-subtitle-1 font-weight-black text-slate-800">Completion Time</span>
                  </div>
                  <div class="text-h5 font-weight-bold text-success pl-9 mb-6">
                    {{ formattedCompletedTime }}
                  </div>
                </template>

                <div class="d-flex align-center gap-3 mb-2">
                  <VIcon
                    icon="tabler-settings"
                    color="primary"
                  />
                  <span class="text-subtitle-1 font-weight-black text-slate-800">Booked Service</span>
                </div>
                
                <div class="service-card pa-4 rounded-xl bg-white border border-slate-200 mb-6">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="text-caption font-weight-bold text-slate-400 text-uppercase mb-1">
                        Service
                      </div>
                      <div class="text-h6 font-weight-black text-slate-800 line-height-tight mb-1">
                        {{ booking.service_name }}
                      </div>
                      <div class="text-body-2 text-slate-500 font-weight-medium">
                        {{ booking.category_name }} • {{ booking.facility_name }}
                      </div>
                    </div>
                    <div
                      v-if="booking.service_snapshot?.price"
                      class="text-right"
                    >
                      <div class="text-caption font-weight-bold text-slate-400 text-uppercase mb-1">
                        Price
                      </div>
                      <div class="text-h6 font-weight-black text-primary">
                        ${{ booking.service_snapshot.price }}
                      </div>
                    </div>
                  </div>
                  
                  <VDivider class="my-3" />
                  
                  <div class="d-flex align-center gap-2">
                    <VIcon
                      icon="tabler-info-circle"
                      size="16"
                      color="slate-400"
                    />
                    <span class="text-caption text-slate-500">Professional service provided by verified experts.</span>
                  </div>
                </div>
              </div>

              <div class="mb-8">
                <div class="d-flex align-center gap-3 mb-2">
                  <VIcon
                    icon="tabler-notes"
                    color="primary"
                  />
                  <span class="text-subtitle-1 font-weight-black text-slate-800">Booking Notes</span>
                </div>
                <div class="text-body-1 text-slate-600 pl-9 bg-white/50 pa-4 rounded-xl border border-white">
                  {{ booking.notes || 'No specific notes provided.' }}
                </div>
              </div>

              <!-- Rejection Reason if any -->
              <div
                v-if="booking.rejection_reason"
                class="mb-8 pa-4 rounded-xl bg-error-lighten-5 border border-error-lighten-4"
              >
                <div class="d-flex align-center gap-2 mb-1 text-error">
                  <VIcon
                    icon="tabler-alert-circle"
                    size="18"
                  />
                  <span class="text-caption font-weight-black uppercase">Rejection Reason</span>
                </div>
                <div class="text-body-2 text-error-darken-1">
                  {{ booking.rejection_reason }}
                </div>
              </div>

              <!-- Inline Actions -->
              <div class="mt-auto pt-6">
                <template v-if="booking.status === 'PENDING'">
                  <VBtn
                    block
                    color="primary"
                    height="56"
                    class="rounded-2xl font-weight-black shadow-primary mb-3"
                    @click="handleAction('accept')"
                  >
                    Accept Request
                  </VBtn>
                  <VBtn
                    block
                    color="error"
                    variant="tonal"
                    height="56"
                    class="rounded-2xl font-weight-black"
                    @click="handleAction('reject')"
                  >
                    Reject
                  </VBtn>
                </template>
                <template v-else-if="booking.status === 'CONFIRMED'">
                  <VBtn
                    block
                    color="success"
                    height="56"
                    class="rounded-2xl font-weight-black shadow-success"
                    prepend-icon="tabler-check"
                    @click="handleAction('complete')"
                  >
                    Mark Completed
                  </VBtn>
                </template>
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-border-color), 0.1) !important;
  box-shadow: 0 40px 80px rgba(0,0,0,0.1) !important;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
}
.status-indicator.pending { background: #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.4); }
.status-indicator.confirmed { background: #3b82f6; box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
.status-indicator.completed { background: #10b981; box-shadow: 0 0 12px rgba(16, 185, 129, 0.4); }
.status-indicator.cancelled { background: #ef4444; }

.grid-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.detail-item .value {
  font-weight: 800;
  color: #1e293b;
  font-size: 14px;
}

.shadow-primary {
  box-shadow: 0 10px 25px rgba(var(--v-theme-primary), 0.2) !important;
}

.shadow-success {
  box-shadow: 0 10px 25px rgba(var(--v-theme-success), 0.2) !important;
}
</style>
