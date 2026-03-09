<script setup>
import { ref, onMounted } from 'vue'
import ProviderLayout from '@/components/ProviderLayout.vue'
import { providerApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'

const reviews = ref([])
const loading = ref(false)
const permissionStore = usePermissionStore()

const stats = ref({
  average: 0,
  total: 0,
  excellent: 0,
})

const fetchMyReviews = async () => {
  loading.value = true
  try {
    const myId = permissionStore.userData?.id || permissionStore.userData?.auth_user_id
    const res = await providerApi.get(`/api/provider/rating/?employee_id=${myId}`)
 
    reviews.value = res.data.results || res.data || []
    
    // Simple stats calculation
    if (reviews.value.length > 0) {
      const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)

      stats.value.average = (sum / reviews.value.length).toFixed(1)
      stats.value.total = reviews.value.length
      stats.value.excellent = reviews.value.filter(r => r.rating >= 4.5).length
    }
  } catch (err) {
    console.error('Failed to fetch reviews:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMyReviews)
</script>

<template>
  <ProviderLayout>
    <div class="employee-reviews-page pa-6 pb-16">
      <div class="mb-8 text-center text-md-start">
        <h1 class="text-h2 font-weight-black text-slate-800 mb-1">
          My Performance
        </h1>
        <p class="text-subtitle-1 text-slate-500">
          See what pet parents are saying about your work
        </p>
      </div>

      <!-- Performance Overview -->
      <VRow class="mb-8">
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            flat
            class="text-center pa-8 rounded-[32px] border bg-gradient-primary text-white"
          >
            <div class="text-h1 font-weight-black mb-2">
              {{ stats.average }}
            </div>
            <VRating
              :model-value="Number(stats.average)"
              readonly
              half-increments
              density="compact"
              color="white"
              active-color="white"
              class="mb-2"
            />
            <div class="text-subtitle-2 opacity-80">
              Average Rating
            </div>
          </VCard>
        </VCol>
        
        <VCol
          cols="12"
          md="8"
        >
          <VRow>
            <VCol cols="6">
              <VCard
                flat
                class="pa-6 rounded-[24px] border h-100"
              >
                <div class="d-flex align-center gap-4">
                  <VAvatar
                    color="success"
                    variant="tonal"
                    size="56"
                    rounded="xl"
                  >
                    <VIcon
                      icon="tabler-medal"
                      size="32"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-h4 font-weight-black">
                      {{ stats.excellent }}
                    </div>
                    <div class="text-caption text-slate-500 uppercase font-weight-bold">
                      Top Feedbacks
                    </div>
                  </div>
                </div>
              </VCard>
            </VCol>
            <VCol cols="6">
              <VCard
                flat
                class="pa-6 rounded-[24px] border h-100"
              >
                <div class="d-flex align-center gap-4">
                  <VAvatar
                    color="info"
                    variant="tonal"
                    size="56"
                    rounded="xl"
                  >
                    <VIcon
                      icon="tabler-message-chat"
                      size="32"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-h4 font-weight-black">
                      {{ stats.total }}
                    </div>
                    <div class="text-caption text-slate-500 uppercase font-weight-bold">
                      Total Reviews
                    </div>
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>
        </VCol>
      </VRow>

      <!-- Feedback List -->
      <div class="mb-6 d-flex align-center justify-space-between">
        <h3 class="text-h4 font-weight-bold">
          Latest Feedback
        </h3>
        <VBtn
          icon="tabler-refresh"
          variant="text"
          color="primary"
          :loading="loading"
          @click="fetchMyReviews"
        />
      </div>

      <div
        v-if="loading"
        class="text-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div v-else-if="reviews.length > 0">
        <VRow>
          <VCol
            v-for="review in reviews"
            :key="review.id"
            cols="12"
          >
            <VCard
              flat
              class="pa-6 rounded-[24px] border hover-card"
            >
              <div class="d-flex align-start gap-4">
                <VAvatar
                  size="48"
                  color="primary"
                  variant="tonal"
                >
                  <VIcon icon="tabler-user" />
                </VAvatar>
                <div class="flex-grow-1">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <h4 class="font-weight-bold">
                      {{ review.customer_name || 'Pet Parent' }}
                    </h4>
                    <span class="text-caption text-slate-400">{{ new Date(review.created_at).toLocaleDateString() }}</span>
                  </div>
                  <VRating
                    :model-value="review.rating"
                    readonly
                    density="compact"
                    size="small"
                    color="warning"
                    class="mb-3"
                  />
                  <p class="text-body-1 text-slate-700 italic border-s-4 pl-4 border-slate-100">
                    "{{ review.review || 'No comment provided.' }}"
                  </p>
                  <div class="mt-4 d-flex align-center gap-2">
                    <VChip
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      class="font-weight-bold"
                    >
                      # {{ review.service_name || 'Pet Care' }}
                    </VChip>
                  </div>
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <div
        v-else
        class="text-center py-16 border rounded-[32px] border-dashed"
      >
        <VIcon
          icon="tabler-mood-smile"
          size="64"
          class="text-slate-200 mb-4"
        />
        <h3 class="text-h5 font-weight-bold text-slate-400">
          No reviews yet
        </h3>
        <p class="text-body-2 text-slate-400">
          Keep up the great work to see student feedback here!
        </p>
      </div>
    </div>
  </ProviderLayout>
</template>

<style scoped lang="scss">
.bg-gradient-primary {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #4f46e5 100%);
}

.hover-card {
  transition: all 0.2s ease;
  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    background-color: rgba(var(--v-theme-primary), 0.02);
  }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
