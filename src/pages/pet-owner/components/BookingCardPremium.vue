<script setup>
import { computed } from 'vue'

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['manage'])

const getStatusColor = status => {
  switch (status?.toUpperCase()) {
  case 'CONFIRMED': return 'success'
  case 'PENDING': return 'warning'
  case 'CANCELLED': return 'error'
  case 'COMPLETED': return 'primary'
  default: return 'slate'
  }
}

const formattedDate = computed(() => {
  if (!props.booking.selected_time) return ''
  
  return new Date(props.booking.selected_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <VCard
    class="booking-card-premium pa-4 mb-4"
    elevation="0"
    border
  >
    <div class="d-flex align-center">
      <div class="provider-avatar-container me-4">
        <VAvatar
          size="56"
          color="primary-lighten-5"
        >
          <VIcon
            icon="tabler-calendar-heart"
            color="primary"
            size="32"
          />
        </VAvatar>
      </div>

      <div class="flex-grow-1">
        <div class="d-flex justify-space-between align-start mb-1">
          <div>
            <h4 class="text-h6 font-weight-bold text-slate-900 mb-1">
              {{ booking.provider_name || 'Service Provider' }}
            </h4>
            
            <!-- Service Details -->
            <div class="mb-2">
              <div class="d-flex justify-space-between align-center">
                <div class="text-subtitle-2 font-weight-black text-slate-800 line-height-tight">
                  {{ booking.service_name }}
                </div>
                <div
                  v-if="booking.service_snapshot?.price"
                  class="text-subtitle-2 font-weight-black text-primary"
                >
                  ${{ booking.service_snapshot.price }}
                </div>
              </div>
              <div class="text-caption text-slate-500 font-weight-medium mb-1">
                {{ booking.category_name }} • {{ booking.facility_name }}
              </div>

              <!-- Descriptions -->
              <div
                v-if="booking.service_snapshot?.category_description || booking.service_snapshot?.facility_description"
                class="booking-description-box mb-2"
              >
                <p
                  v-if="booking.service_snapshot?.category_description"
                  class="text-caption text-slate-400 font-italic mb-0 line-clamp-1"
                >
                  {{ booking.service_snapshot.category_description }}
                </p>
                <p
                  v-if="booking.service_snapshot?.facility_description"
                  class="text-caption text-slate-400 mb-0 line-clamp-1"
                >
                  {{ booking.service_snapshot.facility_description }}
                </p>
              </div>
            </div>

            <!-- Pet Info -->
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-paw"
                size="14"
                color="slate-400"
              />
              <span class="text-caption text-slate-600">For <strong>{{ booking.pet_name }}</strong></span>
            </div>
          </div>
          <VChip
            :color="getStatusColor(booking.status)"
            size="x-small"
            class="font-weight-bold align-self-start mt-1"
            variant="tonal"
          >
            {{ booking.status || 'Scheduled' }}
          </VChip>
        </div>

        <div class="d-flex align-center justify-space-between mt-3">
          <div class="d-flex align-center text-body-2 text-slate-700">
            <VIcon
              icon="tabler-clock"
              size="16"
              class="me-1"
              color="slate-400"
            />
            {{ formattedDate }}
          </div>
          
          <div
            v-if="booking.status === 'CONFIRMED' && booking.completion_otp"
            class="d-flex align-center gap-2 bg-primary-lighten-5 px-3 py-1 rounded-pill"
          >
            <VIcon
              icon="tabler-lock-password"
              size="16"
              color="primary"
            />
            <span class="text-caption font-weight-bold text-slate-500 uppercase">OTP:</span>
            <span class="text-body-2 font-weight-black text-primary tracking-widest">{{ booking.completion_otp }}</span>
          </div>

          <VBtn
            variant="text"
            color="primary"
            size="small"
            class="font-weight-bold"
            @click="emit('manage', booking)"
          >
            Manage
          </VBtn>
        </div>
      </div>
    </div>
  </VCard>
</template>

<style scoped>
.booking-card-premium {
  border-radius: 20px !important;
  transition: all 0.3s ease;
}

.booking-card-premium:hover {
  border-color: var(--v-primary-base) !important;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04) !important;
}

.provider-avatar-container {
  background: white;
  border-radius: 16px;
  padding: 2px;
}

.booking-description-box {
  background: #f1f5f9;
  padding: 8px 12px;
  border-radius: 12px;
  border-left: 3px solid #6366f1;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
