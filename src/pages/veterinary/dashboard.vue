<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed } from 'vue'
import WaitingRoomWidget from '@/components/veterinary/dashboard/WaitingRoomWidget.vue'
import ScheduleWidget from '@/components/veterinary/dashboard/ScheduleWidget.vue'
import VitalsQueueWidget from '@/components/veterinary/dashboard/VitalsQueueWidget.vue'
import DoctorQueueWidget from '@/components/veterinary/dashboard/DoctorQueueWidget.vue'
import LabQueueWidget from '@/components/veterinary/dashboard/LabQueueWidget.vue'
import PharmacyQueueWidget from '@/components/veterinary/dashboard/PharmacyQueueWidget.vue'
import AnalyticsCards from '@/components/veterinary/dashboard/AnalyticsCards.vue'

import { usePermissionStore } from '@/stores/permissionStore'

const permissionStore = usePermissionStore()
const can = cap => permissionStore.hasCapability(cap)

// For now, use VeterinaryLayout for everyone to ensure module context
const currentLayout = VeterinaryLayout

// --- GENERAL STATS ---
// --- GENERAL STATS ---
// Moved to AnalyticsCards.vue
</script>

<template>
  <component :is="currentLayout">
    <div class="veterinary-dashboard">
      <!-- HEADER -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">
            Veterinary Dashboard
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Overview of your clinic's daily activities.
          </p>
        </div>
        <div class="d-flex gap-3">
          <VBtn
            v-if="can('VETERINARY_VISITS')"
            color="primary"
            prepend-icon="tabler-plus"
            :to="{ name: 'veterinary-visits-new' }"
          >
            New Visit
          </VBtn>
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="tabler-paw"
            :to="{ name: 'veterinary-pets-new' }"
          >
            Register Pet
          </VBtn>
        </div>
      </div>

      <!-- STATS ROW (Visible to everyone with Core access) -->
      <AnalyticsCards v-if="can('VETERINARY_CORE')" />

      <!-- MAIN CONTENT -->
      <!-- MAIN CONTENT -->
      <VRow>
        <!-- MAIN COL -->
        <VCol cols="12">
          <!-- RECEPTION: WAITING ROOM -->
          <WaitingRoomWidget v-if="can('VETERINARY_VISITS')" />

          <!-- VITALS STAFF: VITALS QUEUE -->
          <VitalsQueueWidget
            v-if="can('VETERINARY_VITALS')"
            class="mt-6"
          />

          <!-- DOCTOR: PATIENT QUEUE -->
          <DoctorQueueWidget
            v-if="can('VETERINARY_DOCTOR')"
            class="mt-6"
          />

          <!-- LAB: LAB QUEUE -->
          <LabQueueWidget
            v-if="can('VETERINARY_LABS')"
            class="mt-6"
          />

          <!-- PHARMACY: PHARMACY QUEUE -->
          <PharmacyQueueWidget
            v-if="can('VETERINARY_PHARMACY')"
            class="mt-6"
          />

          <!-- SCHEDULE WIDGET (Visible if has Schedule capability - mapped to CORE or VISITS/DOCTOR) -->
          <ScheduleWidget
            v-if="can('VETERINARY_CORE')"
            class="mt-6"
          />
        </VCol>
      </VRow>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
