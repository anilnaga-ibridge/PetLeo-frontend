<script setup>
import { ref, watch } from 'vue'
import { providerApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'

const props = defineProps({
  modelValue: Boolean,
  serviceId: {
    type: String,
    required: true,
  },
  category: {
    type: Object,
    default: null, // If provided, we are in edit mode
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const permissionStore = usePermissionStore()
const loading = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
})

// Reset form when dialog opens
watch(() => props.modelValue, val => {
  if (val) {
    error.value = ''
    if (props.category) {
      form.value = {
        name: props.category.name,
        description: props.category.description || '',
      }
    } else {
      form.value = {
        name: '',
        description: '',
      }
    }
  }
})

const save = async () => {
  if (!form.value.name) return
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await providerApi({
      method: props.category ? 'patch' : 'post',
      url: props.category 
        ? `/api/provider/categories/${props.category.id}/`
        : `/api/provider/categories/`,
      data: payload,
    })
    
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.detail || 'Failed to save category'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle>{{ category ? 'Edit Category' : 'Add New Category' }}</VCardTitle>
      <VCardText>
        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ error }}
        </VAlert>
        
        <VTextField
          v-model="form.name"
          label="Category Name"
          required
          class="mb-4"
        />
        
        <VTextarea
          v-model="form.description"
          label="Description (Optional)"
          rows="3"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn 
          color="primary" 
          variant="elevated" 
          :loading="loading" 
          :disabled="!form.name"
          @click="save"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
