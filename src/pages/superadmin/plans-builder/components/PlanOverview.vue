<script setup>
import { ref, watch, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['planId'])
const emit = defineEmits(['saved'])

const loading = ref(false)
const saving = ref(false)

const form = ref({
  title: '',
  subtitle: '',
  description: '',
  target_type: 'ORGANIZATION',
  billing_cycle: 'MONTHLY',
  is_active: true,
})

const targetTypes = [
  { title: 'Organization', value: 'ORGANIZATION' },
  { title: 'Individual', value: 'INDIVIDUAL' },
]

const billingCycles = ref([])

const fetchMetadata = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/billing-cycles/')
    billingCycles.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch billing cycles:', err)
  }
}

const fetchPlan = async () => {
  if (!props.planId) {
    // Reset form for new plan
    form.value = {
      title: '',
      subtitle: '',
      description: '',
      target_type: 'ORGANIZATION',
      billing_cycle: 'MONTHLY',
      is_active: true,
    }
    return
  }

  loading.value = true
  try {
    const res = await superAdminApi.get(`/api/superadmin/plans/${props.planId}/`)
    form.value = res.data
  } catch (err) {
    console.error('Failed to fetch plan:', err)
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    let res
    if (props.planId) {
      res = await superAdminApi.put(`/api/superadmin/plans/${props.planId}/`, form.value)
    } else {
      res = await superAdminApi.post('/api/superadmin/plans/', form.value)
    }
    emit('saved', res.data)
  } catch (err) {
    console.error('Failed to save plan:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchMetadata()
  fetchPlan()
})

watch(() => props.planId, fetchPlan)
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="pa-6 flex-grow-1 overflow-y-auto">
      <VRow>
        <VCol cols="12" md="8">
          <VCard variant="outlined" class="mb-6 overflow-visible">
            <VCardItem>
              <template #prepend>
                <VIcon icon="tabler-info-circle" class="text-primary" />
              </template>
              <VCardTitle>Basic Information</VCardTitle>
              <VCardSubtitle>Define the core identity of this plan.</VCardSubtitle>
            </VCardItem>
            
            <VCardText class="pt-4">
              <VRow>
                <VCol cols="12">
                  <AppTextField
                    v-model="form.title"
                    label="Plan Title"
                    placeholder="e.g. Gold Plan"
                    required
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextField
                    v-model="form.subtitle"
                    label="Subtitle"
                    placeholder="e.g. Best for growing clinics"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextarea
                    v-model="form.description"
                    label="Description"
                    placeholder="Detailed description of what this plan offers..."
                    rows="3"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VCard variant="outlined" class="overflow-visible">
            <VCardItem>
              <template #prepend>
                <VIcon icon="tabler-settings" class="text-primary" />
              </template>
              <VCardTitle>Configuration</VCardTitle>
              <VCardSubtitle>Set the target audience and billing frequency.</VCardSubtitle>
            </VCardItem>
            
            <VCardText class="pt-4">
              <VRow>
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="form.target_type"
                    :items="targetTypes"
                    label="Target Audience"
                    required
                    attach="body"
                    :menu-props="{
                      attach: 'body',
                      zIndex: 10000,
                      offsetY: true
                    }"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="form.billing_cycle"
                    :items="billingCycles"
                    item-title="display_name"
                    item-value="code"
                    label="Billing Cycle"
                    required
                    attach="body"
                    :menu-props="{
                      attach: 'body',
                      zIndex: 10000,
                      offsetY: true
                    }"
                  />
                </VCol>
                <VCol cols="12">
                  <VSwitch
                    v-model="form.is_active"
                    label="Plan is Active"
                    color="success"
                    inset
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="4">
          <VCard color="primary" variant="tonal" class="mb-4">
            <VCardText>
              <h3 class="text-h6 font-weight-bold mb-2">Plan Preview</h3>
              <p class="text-body-2 mb-4">This is how the plan card might look to users.</p>
              
              <VCard class="bg-surface" elevation="2">
                <VCardText>
                  <div class="d-flex justify-space-between align-start mb-2">
                    <div>
                      <VChip size="x-small" color="info" variant="tonal" class="mb-2 text-uppercase">
                        {{ form.target_type }}
                      </VChip>
                      <h4 class="text-h6 font-weight-bold">{{ form.title || 'Plan Title' }}</h4>
                      <div class="text-caption text-medium-emphasis">{{ form.subtitle || 'Plan Subtitle' }}</div>
                    </div>
                  </div>
                  <div class="text-body-2 text-medium-emphasis mt-2 line-clamp-3">
                    {{ form.description || 'Plan description will appear here.' }}
                  </div>
                </VCardText>
              </VCard>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <div class="pa-4 border-t bg-surface d-flex justify-end">
      <VBtn
        color="primary"
        :loading="saving"
        @click="save"
      >
        {{ props.planId ? 'Update Plan' : 'Create Plan' }}
      </VBtn>
    </div>
  </div>
</template>
