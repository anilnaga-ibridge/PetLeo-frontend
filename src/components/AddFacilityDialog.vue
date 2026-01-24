<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  modelValue: Boolean,
  serviceId: {
    type: String,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  facility: {
    type: Object,
    default: null,
  },
  preselectedCategoryId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
  price: 0,
  category_id: null,
})

watch(() => props.modelValue, val => {
  if (val) {
    error.value = ''
    if (props.facility) {
      form.value = {
        name: props.facility.name,
        description: props.facility.description || '',
        price: props.facility.price || 0,
        category_id: props.facility.category, // Assuming facility has category ID
      }
    } else {
      form.value = {
        name: '',
        description: '',
        price: 0,
        category_id: props.preselectedCategoryId || (props.categories.length > 0 ? props.categories[0].id : null),
      }
    }
  }
})

const save = async () => {
  if (!form.value.name) return
  
  loading.value = true
  error.value = ''
  
  try {
    const url = props.facility 
      ? `http://127.0.0.1:8002/api/provider/facilities/${props.facility.id}/`
      : `http://127.0.0.1:8002/api/provider/facilities/`
      
    const method = props.facility ? 'patch' : 'post'
    const token = localStorage.getItem('accessToken')
    
    // ProviderFacility requires 'category' ID
    const payload = {
      ...form.value,
      category: form.value.category_id,
    }

    // Remove service_id as it's not directly on ProviderFacility (it's on Category)
    // But wait, my serializer might not require it if I set it in perform_create?
    // Actually ProviderFacility links to Category.
    
    await axios({
      method,
      url,
      data: payload,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.detail || 'Failed to save facility'
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
      <VCardTitle>{{ facility ? 'Edit Facility' : 'Add New Facility' }}</VCardTitle>
      <VCardText>
        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ error }}
        </VAlert>
        
        <VSelect
          v-model="form.category_id"
          :items="categories"
          item-title="name"
          item-value="id"
          label="Category"
          required
          class="mb-4"
          :disabled="!!facility" 
        />

        <VTextField
          v-model="form.name"
          label="Facility Name"
          required
          class="mb-4"
        />
        
        <VTextField
          v-model="form.price"
          label="Price"
          type="number"
          prefix="$"
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
