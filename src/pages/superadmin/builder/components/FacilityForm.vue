<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const form = ref({ ...props.modelValue })

watch(() => props.modelValue, (newVal) => {
  // Prevent recursive update if values are effectively same
  if (JSON.stringify(newVal) !== JSON.stringify(form.value)) {
    form.value = { ...newVal }
  }
}, { deep: true })

watch(form, (newVal) => {
  // Only emit if different from prop (optional optimization, but strict sync is safer)
  if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
     emit('update:modelValue', newVal)
  }
}, { deep: true })

const isDurationShown = computed(() => ['PER_SESSION', 'HOURLY'].includes(form.value.billing_unit))

const handleSubmit = () => {
  emit('submit')
}
</script>

<template>
  <VForm id="facilityForm" @submit.prevent="handleSubmit">
    <!-- HIERARCHY CONTEXT -->
    <VCard variant="tonal" color="primary" class="pa-4 mb-6 border-0">
      <h4 class="text-subtitle-1 font-weight-bold mb-4">Location in Menu</h4>
      
      <VSelect
        v-model="form.category"
        :items="categories"
        item-title="name"
        item-value="id"
        label="Parent Category *"
        placeholder="Select category"
        class="mb-4"
        density="comfortable"
        variant="outlined"
        bg-color="surface"
        :rules="[v => !!v || 'Category is required']"
      />

      <AppTextField
        v-model="form.name"
        label="Facility Name *"
        placeholder="e.g. Full Spa Treatment"
        class="mb-4"
        required
        density="comfortable"
        variant="outlined"
        bg-color="surface"
        :rules="[v => !!v || 'Name is required']"
      />

      <AppTextarea
        v-model="form.description"
        label="Description"
        placeholder="Briefly describe this item..."
        class="mb-0"
        density="comfortable"
        variant="outlined"
        bg-color="surface"
        rows="3"
      />
    </VCard>

    <!-- PRICING INTEGRATION -->
    <VCard variant="tonal" color="success" class="pa-4 mb-6 border-0">
      <h4 class="text-subtitle-1 font-weight-bold mb-4 text-success">Service Pricing</h4>
      
      <VSelect
        v-model="form.billing_unit"
        :items="[
          { title: 'Per Session', value: 'PER_SESSION' },
          { title: 'Per Hour', value: 'HOURLY' },
          { title: 'Per Day', value: 'DAILY' },
          { title: 'One Time', value: 'ONE_TIME' }
        ]"
        label="Pricing Unit *"
        class="mb-4"
        density="comfortable"
        variant="outlined"
        bg-color="surface"
      />

      <AppTextField
        v-model.number="form.base_price"
        label="Base Price (₹) *"
        type="number"
        placeholder="500"
        required
        density="comfortable"
        variant="outlined"
        bg-color="surface"
        prepend-inner-icon="tabler-currency-rupee"
        :rules="[v => v >= 0 || 'Price cannot be negative']"
      />

      <AppTextField
        v-if="isDurationShown"
        v-model.number="form.duration_minutes"
        label="Duration (Minutes)"
        type="number"
        placeholder="e.g. 60"
        class="mt-4 mb-0"
        density="comfortable"
        variant="outlined"
        bg-color="surface"
        prepend-inner-icon="tabler-clock"
      />
    </VCard>

    <VCard variant="tonal" color="error" class="pa-4 mb-8 border-0">
      <div class="d-flex justify-space-between align-center">
        <span class="text-body-2 font-weight-bold">Enable Item?</span>
        <VSwitch v-model="form.is_active" color="success" hide-details inset />
      </div>
    </VCard>

    <div class="d-flex justify-end gap-4 mt-6 pt-4 border-t">
      <VBtn variant="outlined" color="secondary" @click="emit('cancel')">Cancel</VBtn>
      <VBtn color="primary" type="submit" :loading="loading">
        {{ isEdit ? 'Update Facility & Price' : 'Save Facility & Price' }}
      </VBtn>
    </div>
  </VForm>
</template>
