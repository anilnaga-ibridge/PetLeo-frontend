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
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const rules = computed(() => {
  const r = []
  if (props.field.is_required) {
    r.push((v) => !!v || `${props.field.label} is required`)
  }
  if (props.field.validations) {
    props.field.validations.forEach((val) => {
      if (val.min_value !== null) {
        r.push((v) => Number(v) >= val.min_value || `Min value is ${val.min_value}`)
      }
      if (val.max_value !== null) {
        r.push((v) => Number(v) <= val.max_value || `Max value is ${val.max_value}`)
      }
      if (val.regex) {
        const re = new RegExp(val.regex)
        r.push((v) => re.test(v) || val.error_message || 'Invalid format')
      }
    })
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
  <div class="dynamic-field mb-4">
    <!-- TEXT & NUMBER -->
    <VTextField
      v-if="['TEXT', 'NUMBER'].includes(field.field_type)"
      v-model="localValue"
      :label="field.label"
      :type="inputType"
      :suffix="field.unit"
      :rules="rules"
      :readonly="readOnly"
      variant="outlined"
      density="comfortable"
    />

    <!-- TEXTAREA -->
    <VTextarea
      v-else-if="field.field_type === 'TEXTAREA'"
      v-model="localValue"
      :label="field.label"
      :rules="rules"
      :readonly="readOnly"
      variant="outlined"
      density="comfortable"
      auto-grow
    />

    <!-- SELECT (DROPDOWN) -->
    <VSelect
      v-else-if="field.field_type === 'DROPDOWN' || field.field_type === 'SELECT'"
      v-model="localValue"
      :label="field.label"
      :items="field.options || field.metadata?.options || []"
      :rules="rules"
      :readonly="readOnly"
      variant="outlined"
      density="comfortable"
    />

    <!-- MULTISELECT -->
    <VSelect
      v-else-if="field.field_type === 'MULTISELECT'"
      v-model="localValue"
      :label="field.label"
      :items="field.options || field.metadata?.options || []"
      :rules="rules"
      :readonly="readOnly"
      variant="outlined"
      density="comfortable"
      multiple
      chips
    />

    <!-- BOOLEAN -->
    <VCheckbox
      v-else-if="field.field_type === 'BOOLEAN'"
      v-model="localValue"
      :label="field.label"
      :readonly="readOnly"
      density="comfortable"
    />

    <!-- DATE -->
    <VTextField
      v-else-if="field.field_type === 'DATE'"
      v-model="localValue"
      :label="field.label"
      type="date"
      :rules="rules"
      :readonly="readOnly"
      variant="outlined"
      density="comfortable"
    />

    <!-- FILE -->
    <VFileInput
      v-else-if="field.field_type === 'FILE'"
      v-model="localValue"
      :label="field.label"
      :rules="rules"
      :readonly="readOnly"
      variant="outlined"
      density="comfortable"
      prepend-icon="tabler-paperclip"
    />
  </div>
</template>
