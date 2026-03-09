
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const policies = ref({
  cancellation_policy: '',
  reschedule_policy: '',
  safety_measures: '',
  house_rules: '',
})

const loading = ref(false)
const saving = ref(false)
const success = ref(false)

const fetchPolicies = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/my-policies/')

    policies.value = res.data
  } catch (err) {
    console.error('Failed to fetch policies', err)
  } finally {
    loading.value = false
  }
}

const savePolicies = async () => {
  saving.value = true
  success.value = false
  try {
    await providerApi.patch(`/api/provider/my-policies/${policies.value.id}/`, policies.value)
    success.value = true
  } catch (err) {
    console.error('Failed to save policies', err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchPolicies)
</script>

<template>
  <VCard
    title="Business Policies"
    subtitle="Setting clear expectations helps avoid disputes and ensures a smooth experience."
  >
    <VCardText
      v-if="loading"
      class="text-center pa-12"
    >
      <VProgressCircular indeterminate />
    </VCardText>
    
    <VCardText v-else>
      <VForm @submit.prevent="savePolicies">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextarea 
              v-model="policies.cancellation_policy" 
              label="Cancellation Policy" 
              placeholder="e.g. Free cancellation up to 24 hours before..."
              rows="4" 
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextarea 
              v-model="policies.reschedule_policy" 
              label="Reschedule Policy" 
              placeholder="e.g. Rescheduling depends on availability..." 
              rows="4"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextarea 
              v-model="policies.safety_measures" 
              label="Safety Measures" 
              placeholder="e.g. All pets must be vaccinated and on a leash..." 
              rows="4"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextarea 
              v-model="policies.house_rules" 
              label="House Rules" 
              placeholder="e.g. Please arrive 5 minutes early. Only one person per pet..." 
              rows="4"
            />
          </VCol>
          
          <VCol
            cols="12"
            class="d-flex align-center gap-4"
          >
            <VBtn
              :loading="saving"
              type="submit"
              color="primary"
            >
              Save Policies
            </VBtn>
            <VAlert
              v-if="success"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-0 flex-grow-1"
            >
              Policies updated successfully!
            </VAlert>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>
