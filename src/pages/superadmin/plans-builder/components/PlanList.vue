<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['selectedId'])
const emit = defineEmits(['select', 'create'])

const plans = ref([])
const loading = ref(false)

const fetchPlans = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/plans/')
    plans.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch plans:', err)
  } finally {
    loading.value = false
  }
}

const selectPlan = (planId) => {
  emit('select', planId)
}

onMounted(fetchPlans)

defineExpose({ fetchPlans })
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="pa-4 border-b">
      <VBtn
        block
        color="primary"
        prepend-icon="tabler-plus"
        @click="emit('create')"
      >
        Create Plan
      </VBtn>
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-2">
      <div v-if="loading" class="d-flex justify-center py-4">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <VList v-else lines="two" nav class="bg-transparent">
        <VListItem
          v-for="plan in plans"
          :key="plan.id"
          :value="plan.id"
          :active="props.selectedId === plan.id"
          color="primary"
          rounded="lg"
          class="mb-1"
          @click="selectPlan(plan.id)"
        >
          <template #prepend>
            <VAvatar color="surface-variant" variant="tonal" size="40" class="me-3">
              <VIcon icon="tabler-package" size="24" />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-bold">
            {{ plan.title }}
          </VListItemTitle>
          <VListItemSubtitle class="text-caption">
            {{ plan.target_type }} • {{ plan.billing_cycle }}
          </VListItemSubtitle>

          <template #append>
            <VChip
              size="x-small"
              :color="plan.is_active ? 'success' : 'error'"
              variant="tonal"
            >
              {{ plan.is_active ? 'Active' : 'Inactive' }}
            </VChip>
          </template>
        </VListItem>
      </VList>
    </div>
  </div>
</template>
