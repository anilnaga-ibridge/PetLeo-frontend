<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const form = ref({ 
  ...props.modelValue,
  session_duration_value: props.modelValue.duration_minutes >= 60 && props.modelValue.duration_minutes % 60 === 0 
    ? props.modelValue.duration_minutes / 60 
    : (props.modelValue.duration_minutes || 60),
  session_duration_unit: props.modelValue.duration_minutes >= 60 && props.modelValue.duration_minutes % 60 === 0 
    ? 'hours' 
    : 'minutes',
})

watch(() => props.modelValue, newVal => {
  if (JSON.stringify(newVal) !== JSON.stringify(form.value)) {
    form.value = { 
      ...newVal,
      session_duration_value: newVal.duration_minutes >= 60 && newVal.duration_minutes % 60 === 0 
        ? newVal.duration_minutes / 60 
        : (newVal.duration_minutes || 60),
      session_duration_unit: newVal.duration_minutes >= 60 && newVal.duration_minutes % 60 === 0 
        ? 'hours' 
        : 'minutes',
    }
  }
}, { deep: true })

// Sync session duration back to duration_minutes
watch([() => form.value.session_duration_value, () => form.value.session_duration_unit], ([val, unit]) => {
  if (val) {
    form.value.duration_minutes = unit === 'hours' ? val * 60 : val
  }
})

watch(form, newVal => {
  if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', newVal)
  }
}, { deep: true })

// Protocol Map
const protocolMap = {
  'MINUTES': 'MINUTES_BASED',
  'HOURS': 'SESSION_BASED',
  'DAYS': 'DAY_BASED',
  'SESSIONS': 'SESSION_BASED',
  'DOCTOR_VISIT': 'MINUTES_BASED',
  'PRODUCT': 'MINUTES_BASED',
  'SUBSCRIPTION': 'MINUTES_BASED',
}

// AUTO-MAP LOGIC: Set pricing strategy based on duration basis
watch(() => form.value.service_duration_type, newType => {
  // Sync protocol_type
  form.value.protocol_type = protocolMap[newType] || 'MINUTES_BASED'

  switch (newType) {
  case 'MINUTES':
    form.value.pricing_model = 'PER_UNIT'
    form.value.billing_unit = 'PER_SESSION'
    break
  case 'HOURS':
    form.value.pricing_model = 'PER_UNIT'
    form.value.billing_unit = 'HOURLY'
    break
  case 'DAYS':
    form.value.pricing_model = 'PER_UNIT'
    form.value.billing_unit = 'DAILY'
    break
  case 'SESSIONS':
    form.value.pricing_model = 'FIXED'
    form.value.billing_unit = 'PER_SESSION'
    break
  case 'PRODUCT':
    form.value.pricing_model = 'FIXED'
    form.value.billing_unit = 'ONE_TIME'
    break
  case 'SUBSCRIPTION':
    form.value.pricing_model = 'MONTHLY'
    form.value.billing_unit = 'MONTHLY'
    break
  }
})

const isDurationShown = computed(() => ['PER_SESSION', 'HOURLY'].includes(form.value.billing_unit))
const isStandardDurationShown = computed(() => form.value.service_duration_type === 'MINUTES')
const isDurationValueShown = computed(() => ['HOURS', 'SESSIONS'].includes(form.value.service_duration_type))

const durationTypeOptions = [
  { title: 'Minute Based (Slots)', value: 'MINUTES' },
  { title: 'Hour Based (Duration)', value: 'HOURS' },
  { title: 'Day Based (Boarding/Hostel)', value: 'DAYS' },
  { title: 'Session Based (Packages)', value: 'SESSIONS' },
  { title: 'Doctor Based (Veterinary)', value: 'DOCTOR_VISIT' },
  { title: 'Product Based (Food/Supply)', value: 'PRODUCT' },
  { title: 'Subscription Based', value: 'SUBSCRIPTION' },
]

const pricingModelOptions = [
  { title: 'Fixed Total Price', value: 'FIXED' },
  { title: 'Per Unit (Min/Hr/Day)', value: 'PER_UNIT' },
  { title: 'Weekly Rate', value: 'WEEKLY' },
  { title: 'Monthly Rate', value: 'MONTHLY' },
  { title: 'Yearly Rate', value: 'YEARLY' },
]

const handleSubmit = () => {
  emit('submit')
}
</script>

<template>
  <VForm
    id="facilityForm"
    @submit.prevent="handleSubmit"
  >
    <!-- HIERARCHY CONTEXT -->
    <VCard
      variant="tonal"
      color="primary"
      class="pa-4 mb-6 border-0"
    >
      <h4 class="text-subtitle-1 font-weight-bold mb-4">
        Location in Menu
      </h4>
      
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

    <!-- PRICING & PROTOCOL INTEGRATION -->
    <VCard
      variant="tonal"
      color="success"
      class="pa-4 mb-6 border-0"
    >
      <h4 class="text-subtitle-1 font-weight-bold mb-4 text-success">
        Booking Protocol & Pricing
      </h4>
      
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VSelect
            v-model="form.service_duration_type"
            :items="durationTypeOptions"
            label="Duration Basis (Behavior) *"
            class="mb-4"
            density="comfortable"
            variant="outlined"
            bg-color="surface"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VSelect
            v-model="form.pricing_model"
            :items="pricingModelOptions"
            label="Pricing Strategy *"
            class="mb-4"
            density="comfortable"
            variant="outlined"
            bg-color="surface"
          />
        </VCol>
      </VRow>

      <!-- HIDDEN ADVANCED FIELDS (Auto-mapped) -->
      <div v-if="false">
        <VSelect
          v-model="form.pricing_model"
          :items="pricingModelOptions"
        />
        <VSelect
          v-model="form.billing_unit"
          :items="[
            { title: 'Per Session', value: 'PER_SESSION' },
            { title: 'Per Hour', value: 'HOURLY' },
            { title: 'Per Day', value: 'DAILY' },
            { title: 'Per Week', value: 'WEEKLY' },
            { title: 'Per Month', value: 'MONTHLY' },
            { title: 'Per Year', value: 'YEARLY' },
            { title: 'One Time', value: 'ONE_TIME' }
          ]"
        />
      </div>

      <VRow>
        <VCol
          cols="12"
          md="6"
        >
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
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <!-- Standard Slot Duration (MINUTES based) -->
          <AppTextField
            v-if="form.service_duration_type === 'MINUTES'"
            v-model.number="form.session_duration_value"
            label="Slot Duration *"
            type="number"
            placeholder="e.g. 30"
            density="comfortable"
            variant="outlined"
            bg-color="surface"
            prepend-inner-icon="tabler-clock"
            style="flex: 2;"
          >
            <template #append-inner>
              <VSelect
                v-model="form.session_duration_unit"
                :items="['minutes', 'hours']"
                density="compact"
                variant="plain"
                hide-details
                style="width: 90px;"
              />
            </template>
          </AppTextField>

          <!-- Session Duration (SESSIONS/HOURS based) -->
          <div
            v-else-if="['SESSIONS', 'HOURS'].includes(form.service_duration_type)"
            class="d-flex align-center gap-2"
          >
            <AppTextField
              v-model.number="form.session_duration_value"
              label="Session Duration *"
              type="number"
              placeholder="e.g. 1"
              density="comfortable"
              variant="outlined"
              bg-color="surface"
              style="flex: 2;"
            />
            <VSelect
              v-model="form.session_duration_unit"
              :items="['minutes', 'hours']"
              label="Unit"
              density="comfortable"
              variant="outlined"
              bg-color="surface"
              style="flex: 1;"
              class="mt-1"
            />
          </div>

          <!-- Legacy Duration Value (Sessions in a package) -->
          <AppTextField
            v-if="form.service_duration_type === 'SESSIONS'"
            v-model.number="form.duration_value"
            label="Default Total Sessions"
            type="number"
            placeholder="e.g. 10"
            class="mt-4"
            density="comfortable"
            variant="outlined"
            bg-color="surface"
            prepend-inner-icon="tabler-hash"
            hint="Number of sessions included in this fixed price package"
            persistent-hint
          />
        </VCol>
      </VRow>

      <VRow class="mt-2">
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model.number="form.daily_capacity"
            label="Daily Capacity"
            type="number"
            placeholder="Max per day"
            density="comfortable"
            variant="outlined"
            bg-color="surface"
            hint="Global limit for this facility"
            persistent-hint
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model.number="form.monthly_limit"
            label="Monthly Limit"
            type="number"
            placeholder="Max per month"
            density="comfortable"
            variant="outlined"
            bg-color="surface"
          />
        </VCol>
      </VRow>
    </VCard>

    <VCard
      variant="tonal"
      color="error"
      class="pa-4 mb-8 border-0"
    >
      <div class="d-flex justify-space-between align-center">
        <span class="text-body-2 font-weight-bold">Enable Item?</span>
        <VSwitch
          v-model="form.is_active"
          color="success"
          hide-details
          inset
        />
      </div>
    </VCard>

    <div class="d-flex justify-end gap-4 mt-6 pt-4 border-t">
      <VBtn
        variant="outlined"
        color="secondary"
        @click="emit('cancel')"
      >
        Cancel
      </VBtn>
      <VBtn
        color="primary"
        type="submit"
        :loading="loading"
      >
        {{ isEdit ? 'Update Facility & Price' : 'Save Facility & Price' }}
      </VBtn>
    </div>
  </VForm>
</template>
