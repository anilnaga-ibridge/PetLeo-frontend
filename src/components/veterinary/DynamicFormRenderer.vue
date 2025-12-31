<script setup>
import { ref, onMounted, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import DynamicField from './DynamicField.vue'

const props = defineProps({
  formCode: {
    type: String,
    required: true,
  },
  visitId: {
    type: String,
    required: true,
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submitted', 'cancel'])

const store = useVeterinaryStore()
const formDefinition = ref(null)
const formData = ref({})
const valid = ref(false)
const formRef = ref(null)
const loading = ref(false)

const loadForm = async () => {
  loading.value = true
  try {
    formDefinition.value = await store.fetchFormDefinition(props.formCode)
    
    // Initialize data
    const data = { ...props.initialData }
    if (formDefinition.value.fields) {
      formDefinition.value.fields.forEach(field => {
        if (data[field.field_key] === undefined) {
          if (field.field_type === 'BOOLEAN') {
            data[field.field_key] = false
          } else if (field.field_type === 'MULTISELECT') {
            data[field.field_key] = []
          } else {
            data[field.field_key] = null
          }
        }
      })
    }
    formData.value = data
  } catch (e) {
    console.error("Error loading form", e)
  } finally {
    loading.value = false
  }
}

onMounted(loadForm)

const submit = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  loading.value = true
  try {
    await store.submitForm(props.visitId, props.formCode, formData.value)
    emit('submitted')
  } catch (e) {
    console.error("Error submitting form", e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VCard :loading="loading" class="dynamic-form-card">
    <VCardTitle v-if="formDefinition">
      {{ formDefinition.name }}
    </VCardTitle>
    
    <VCardText v-if="loading && !formDefinition" class="text-center py-5">
      <VProgressCircular indeterminate color="primary" />
    </VCardText>

    <VCardText v-else-if="formDefinition">
      <VForm ref="formRef" v-model="valid" @submit.prevent="submit">
        <div v-for="field in formDefinition.fields" :key="field.id">
          <DynamicField
            :field="field"
            v-model="formData[field.field_key]"
            :read-only="readOnly"
          />
        </div>
      </VForm>
    </VCardText>

    <VCardActions v-if="!readOnly && formDefinition">
      <VSpacer />
      <VBtn variant="text" color="secondary" @click="$emit('cancel')">
        Cancel
      </VBtn>
      <VBtn
        color="primary"
        variant="elevated"
        :loading="loading"
        @click="submit"
      >
        Submit
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<style scoped>
.dynamic-form-card {
  max-width: 800px;
  margin: 0 auto;
}
</style>
