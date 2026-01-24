<script setup>
import { computed } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: null,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  hideLabel: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const rules = computed(() => {
  const r = []
  if (props.field.is_required) {
    r.push(v => !!v || `${props.field.label} is required`)
  }

  // Add basic type validation for Number
  if (props.field.field_type === 'NUMBER' && props.modelValue) {
    r.push(v => !isNaN(v) || 'Must be a number')
  }
  
  return r
})

const inputType = computed(() => {
  switch (props.field.field_type) {
  case 'NUMBER': return 'number'
  case 'DATE': return 'date'
  default: return 'text'
  }
})
</script>

<template>
  <div class="dynamic-field">
    <!-- TEXT & NUMBER -->
    <VTextField
      v-if="['TEXT', 'NUMBER'].includes(field.field_type)"
      v-model="localValue"
      :label="hideLabel ? '' : field.label"
      :type="inputType"
      :suffix="field.unit"
      :rules="rules"
      :readonly="readOnly"
      variant="solo"
      flat
      bg-color="f6f6f6"
      class="rounded-lg"
    />

    <!-- TEXTAREA -->
    <VTextarea
      v-else-if="field.field_type === 'TEXTAREA'"
      v-model="localValue"
      :label="hideLabel ? '' : field.label"
      :rules="rules"
      :readonly="readOnly"
      variant="solo"
      flat
      bg-color="f6f6f6"
      auto-grow
      class="rounded-lg"
    />

    <!-- SELECT (DROPDOWN) -->
    <VSelect
      v-else-if="field.field_type === 'DROPDOWN' || field.field_type === 'SELECT'"
      v-model="localValue"
      :label="hideLabel ? '' : field.label"
      :items="field.options || field.metadata?.options || []"
      :rules="rules"
      :readonly="readOnly"
      variant="solo"
      flat
      bg-color="f6f6f6"
      class="rounded-lg"
    />

    <!-- BOOLEAN -->
    <VCheckbox
      v-else-if="field.field_type === 'BOOLEAN'"
      v-model="localValue"
      :label="field.label"
      :readonly="readOnly"
      density="comfortable"
      color="primary"
    />

    <!-- DATE -->
    <VTextField
      v-else-if="field.field_type === 'DATE'"
      v-model="localValue"
      :label="hideLabel ? '' : field.label"
      type="date"
      :rules="rules"
      :readonly="readOnly"
      variant="solo"
      flat
      bg-color="f6f6f6"
      class="rounded-lg"
    />
  </div>
</template>

<style scoped>
:deep(.v-field__input) {
  min-height: 44px;
}
</style>
