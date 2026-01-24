<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import WaitingRoomWidget from '@/components/veterinary/dashboard/WaitingRoomWidget.vue'
import ScheduleWidget from '@/components/veterinary/dashboard/ScheduleWidget.vue'
import VitalsQueueWidget from '@/components/veterinary/dashboard/VitalsQueueWidget.vue'
import DoctorQueueWidget from '@/components/veterinary/dashboard/DoctorQueueWidget.vue'
import LabQueueWidget from '@/components/veterinary/dashboard/LabQueueWidget.vue'
import PharmacyQueueWidget from '@/components/veterinary/dashboard/PharmacyQueueWidget.vue'
import AnalyticsCards from '@/components/veterinary/dashboard/AnalyticsCards.vue'
import { usePermissionStore } from '@/stores/permissionStore'

definePage({
  meta: {
    layout: 'blank',
  },
})

const permissionStore = usePermissionStore()
const userData = useCookie('userData')

// Helper to check permissions (using store or local)
const can = cap => permissionStore.hasCapability(cap)
</script>

<template>
  <VeterinaryLayout>
    <div class="dashboard-container pa-6">
      <!-- HEADER -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">
            Dashboard
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Welcome to your daily overview.
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
            v-if="can('VETERINARY_CORE')"
            variant="outlined"
            color="secondary"
            prepend-icon="tabler-paw"
            :to="{ name: 'veterinary-pets-new' }"
          >
            Register Pet
          </VBtn>
        </div>
      </div>

      <!-- ANALYTICS -->
      <AnalyticsCards v-if="can('VETERINARY_CORE')" />

      <!-- WIDGETS -->
      <VRow class="mt-2">
        <VCol cols="12">
          <!-- RECEPTION -->
          <WaitingRoomWidget v-if="can('VETERINARY_VISITS')" />

          <!-- VITALS -->
          <VitalsQueueWidget
            v-if="can('VETERINARY_VITALS')"
            class="mt-6"
          />

          <!-- DOCTOR -->
          <DoctorQueueWidget
            v-if="can('VETERINARY_DOCTOR')"
            class="mt-6"
          />

          <!-- LAB -->
          <LabQueueWidget
            v-if="can('VETERINARY_LABS')"
            class="mt-6"
          />

          <!-- PHARMACY -->
          <PharmacyQueueWidget
            v-if="can('VETERINARY_PHARMACY')"
            class="mt-6"
          />

          <!-- SCHEDULE -->
          <ScheduleWidget
            v-if="can('VETERINARY_CORE')"
            class="mt-6"
          />
        </VCol>
      </VRow>
    </div>
  </VeterinaryLayout>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
}
</style>
