<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { api } from '@/plugins/axios'
import { onMounted, ref } from 'vue'

const plans = ref([])
const loading = ref(false)

const fetchPurchasedPlans = async () => {
  loading.value = true
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/cart/purchased/')

    plans.value = res.data
  } catch (err) {
    console.error('Failed to fetch purchased plans:', err)
  } finally {
    loading.value = false
  }
}

const formatDate = dateString => {
  if (!dateString) return 'N/A'
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchPurchasedPlans()
})
</script>

<template>
  <ProviderLayout>
    <div class="pa-4">
      <VRow>
      <VCol cols="12">
        <h2 class="text-h4 mb-4">
          Plan Bookings
        </h2>
        <p>View your purchased plans and subscription history.</p>
      </VCol>

      <VCol cols="12">
        <VCard>
          <VCardItem title="Purchased Plans">
            <template #append>
              <VBtn
                icon="tabler-refresh"
                variant="text"
                :loading="loading"
                @click="fetchPurchasedPlans"
              />
            </template>
          </VCardItem>
          
          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th scope="col">
                  Plan Name
                </th>
                <th scope="col">
                  Billing Cycle
                </th>
                <th scope="col">
                  Price
                </th>
                <th scope="col">
                  Purchase Date
                </th>
                <th scope="col">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td
                  colspan="5"
                  class="text-center py-4"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </td>
              </tr>
              <tr v-else-if="plans.length === 0">
                <td
                  colspan="5"
                  class="text-center py-4 text-disabled"
                >
                  No purchased plans found.
                </td>
              </tr>
              <tr
                v-for="plan in plans"
                v-else
                :key="plan.id"
              >
                <td>
                  <div class="d-flex align-center">
                    <VAvatar
                      color="primary"
                      variant="tonal"
                      size="32"
                      class="me-2"
                    >
                      <VIcon
                        icon="tabler-package"
                        size="18"
                      />
                    </VAvatar>
                    <span class="font-weight-medium">{{ plan.plan_title }}</span>
                  </div>
                </td>
                <td>{{ plan.billing_cycle_name }}</td>
                <td class="text-primary font-weight-bold">
                  {{ plan.price_currency }} {{ plan.price_amount }}
                </td>
                <td>{{ formatDate(plan.created_at) }}</td>
                <td>
                  <VChip
                    :color="plan.is_active ? 'success' : 'error'"
                    size="small"
                    label
                  >
                    {{ plan.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>
      </VRow>
    </div>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
