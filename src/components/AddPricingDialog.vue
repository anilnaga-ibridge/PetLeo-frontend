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
  pricing: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const error = ref('')

const form = ref({
  category_id: null,
  facility_id: null,
  price: 0,
  duration: 'per_day',
  discount: 0,
})

const availableFacilities = ref([])

// Watch for category change to filter facilities
watch(() => form.value.category_id, newCatId => {
  if (newCatId) {
    const cat = props.categories.find(c => c.id === newCatId)

    availableFacilities.value = cat ? cat.facilities : []
  } else {
    availableFacilities.value = []
  }

  // Reset facility if it doesn't belong to new category
  if (form.value.facility_id && !availableFacilities.value.find(f => f.id === form.value.facility_id)) {
    form.value.facility_id = null
  }
})

watch(() => props.modelValue, val => {
  if (val) {
    error.value = ''
    if (props.pricing) {
      form.value = {
        category_id: props.pricing.category,
        facility_id: props.pricing.facility,
        price: props.pricing.price || 0,
        duration: props.pricing.duration || 'per_day',
        discount: props.pricing.discount || 0,
      }

      // Populate facilities for selected category
      const cat = props.categories.find(c => c.id === props.pricing.category)

      availableFacilities.value = cat ? cat.facilities : []
    } else {
      form.value = {
        category_id: null,
        facility_id: null,
        price: 0,
        duration: 'per_day',
        discount: 0,
      }
      availableFacilities.value = []
    }
  }
})

const save = async () => {
  if (!form.value.price) return
  
  loading.value = true
  error.value = ''
  
  try {
    const url = props.pricing
      ? `http://127.0.0.1:8002/api/provider/pricing/${props.pricing.id}/`
      : `http://127.0.0.1:8002/api/provider/pricing/`
      
    const method = props.pricing ? 'patch' : 'post'
    const token = localStorage.getItem('accessToken')
    
    const payload = {
      ...form.value,
      service_id: props.serviceId,
      facility: form.value.facility_id, // Map to backend field name
    }

    delete payload.facility_id // Remove old key if not needed, though DRF ignores extra fields usually

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
    error.value = err.response?.data?.detail || 'Failed to save pricing'
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
      <VCardTitle>{{ pricing ? 'Edit Pricing' : 'Add New Pricing' }}</VCardTitle>
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
          label="Category (Optional)"
          clearable
          class="mb-4"
        />
        
        <VSelect
          v-model="form.facility_id"
          :items="availableFacilities"
          item-title="name"
          item-value="id"
          label="Facility (Optional)"
          clearable
          class="mb-4"
          :disabled="!form.category_id"
          hint="Select a category first"
          persistent-hint
        />
        
        <VTextField
          v-model="form.price"
          label="Price"
          type="number"
          prefix="$"
          required
          class="mb-4"
        />
        
        <VSelect
          v-model="form.duration"
          :items="['per_hour', 'per_day', 'per_visit', 'fixed']"
          label="Duration / Unit"
          class="mb-4"
        />
        
        <VTextField
          v-model="form.discount"
          label="Discount (%)"
          type="number"
          suffix="%"
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
          :disabled="!form.price"
          @click="save"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
