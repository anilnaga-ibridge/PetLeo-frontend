<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
})

const steps = [
  { status: 'CREATED', label: 'Arrived' },
  { status: 'CHECKED_IN', label: 'Checked In' },
  { status: 'VITALS_RECORDED', label: 'Vitals' },
  { status: 'DOCTOR_ASSIGNED', label: 'Consultation' },
  { status: 'PRESCRIPTION_FINALIZED', label: 'Pharmacy' },
  { status: 'CLOSED', label: 'Completed' },
]

const currentStepIndex = computed(() => {
  return steps.findIndex(step => step.status === props.status)
})

// If status is not in the main flow (e.g., LAB_RESULTS_READY), map it to nearest step
const activeStep = computed(() => {
  if (currentStepIndex.value !== -1) return currentStepIndex.value
  
  // Mapping for intermediate statuses
  if (props.status === 'LAB_ORDERED' || props.status === 'LAB_RESULTS_READY') return 3 // During Consultation
  if (props.status === 'MEDICINES_DISPENSED') return 4 // Pharmacy
  
  return 0
})
</script>

<template>
  <div class="visit-status-stepper py-4">
    <VStepper
      v-model="activeStep"
      :items="steps.map(s => s.label)"
      alt-labels
      hide-actions
      flat
      class="elevation-0"
    />
  </div>
</template>

<style scoped>
.visit-status-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
  background-color: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}
.visit-status-stepper :deep(.v-stepper-item--complete .v-stepper-item__avatar) {
  background-color: rgb(var(--v-theme-success)) !important;
  border-color: rgb(var(--v-theme-success)) !important;
}
</style>
