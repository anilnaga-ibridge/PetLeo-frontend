<script setup>
import { ref, onMounted } from 'vue'
import { useServiceStore } from '@/stores/servicestore'
import { useCategoryStore } from '@/stores/createcategory'
import { useRouter } from 'vue-router'

const router = useRouter()
const serviceStore = useServiceStore()
const categoryStore = useCategoryStore()

onMounted(serviceStore.fetchServices)

const form = ref({
  service: null,
  name: '',
  description: '',
  is_active: true,
})

const successMessage = ref('')
const errorMessage = ref('')

const submitCategory = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  const success = await categoryStore.createCategory(form.value)

  if (success) {
    successMessage.value = "✅ Category created successfully!"
    form.value = { service: null, name: '', description: '', is_active: true }
  } else {
    errorMessage.value = categoryStore.error
  }
}
const goToCategories = () => {
  router.push('dynamicservices')  // 👈 your route path here
}

// ===========================================================
</script>

<template>
 <div class="flex min-h-screen justify-center items-start bg-grey-lighten-4 relative pa-6 mt-16">

    <button @click="goToCategories" class="redirect-btn">
  ➕ Add Service
</button>

    <VCard class="pa-4" max-width="600" outlined>
      <h3 class="mb-4 text-h5 font-weight-medium text-center">Create Category</h3>

      <VAlert v-if="successMessage" type="success" variant="tonal" class="mb-2">
        {{ successMessage }}
      </VAlert>

      <VAlert v-if="categoryStore.error" type="error" variant="tonal" class="mb-2">
        {{ categoryStore.error }}
      </VAlert>

      <VForm @submit.prevent="submitCategory">
        <VSelect
          label="Select Service"
          :items="serviceStore.services"
          item-title="display_name"
          item-value="id"
          v-model="form.service"
          class="mb-3"
        />

        <AppTextField
          label="Category Name"
          v-model="form.name"
          class="mb-3"
        />

        <AppTextField
          label="Description"
          v-model="form.description"
          class="mb-3"
          type="textarea"
          rows="3"
        />

        <VCheckbox
          label="Active"
          v-model="form.is_active"
          class="mb-3"
        />

        <VBtn class="mt-2" type="submit" :loading="categoryStore.loading" block>
          Save Category
        </VBtn>
      </VForm>
    </VCard>
  </div>
</template>

<style>
.redirect-btn {
  position: absolute;
  top: 80px;
  right: 50px;
  background-color: #0b25ec;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
}
.redirect-btn:hover {
  background-color: #5107ef;
}

</style>