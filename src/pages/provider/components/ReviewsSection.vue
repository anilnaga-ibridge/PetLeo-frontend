
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const reviews = ref([])
const loading = ref(true)
const error = ref('')

const fetchReviews = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await providerApi.get('/api/provider/rating/')

    reviews.value = res.data
  } catch (err) {
    console.error('Failed to fetch reviews:', err)
    error.value = 'Failed to load reviews. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchReviews)

const formatDate = dateStr => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Response Logic
const respondingTo = ref(null)
const responseText = ref('')
const submittingResponse = ref(false)

const startResponse = review => {
  respondingTo.value = review.id
  responseText.value = review.provider_response || ''
}

const submitResponse = async reviewId => {
  if (!responseText.value.trim()) return

  submittingResponse.value = true
  try {
    const res = await providerApi.patch('/api/provider/rating/', {
      rating_id: reviewId,
      response: responseText.value,
    })

    // Update local state
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      review.provider_response = res.data.provider_response
      review.responded_at = res.data.responded_at
    }

    respondingTo.value = null
    responseText.value = ''
  } catch (err) {
    console.error('Failed to submit response:', err)
  } finally {
    submittingResponse.value = false
  }
}
</script>

<template>
  <VCard
    class="reviews-section"
    elevation="2"
  >
    <VCardItem class="pb-2">
      <template #prepend>
        <VAvatar
          color="amber"
          variant="tonal"
          size="48"
          rounded="lg"
        >
          <VIcon
            icon="tabler-star"
            size="24"
          />
        </VAvatar>
      </template>
      <VCardTitle class="text-h4 font-weight-bold">
        Customer Reviews
      </VCardTitle>
      <VCardSubtitle>See what pet owners are saying about your service</VCardSubtitle>
    </VCardItem>

    <VDivider />

    <VCardText class="pa-6">
      <div
        v-if="loading"
        class="d-flex justify-center py-8"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="error"
        class="text-center py-8"
      >
        <VIcon
          icon="tabler-alert-circle"
          color="error"
          size="48"
          class="mb-2"
        />
        <p class="text-body-1 text-error">
          {{ error }}
        </p>
        <VBtn
          variant="text"
          color="primary"
          @click="fetchReviews"
        >
          Try Again
        </VBtn>
      </div>

      <div
        v-else-if="reviews.length === 0"
        class="text-center py-12"
      >
        <VIcon
          icon="tabler-message-off"
          size="64"
          class="mb-4 opacity-20"
        />
        <h3 class="text-h4 font-weight-bold mb-2">
          No reviews yet
        </h3>
        <p class="text-body-1 text-medium-emphasis">
          When customers rate your service, they will appear here.
        </p>
      </div>

      <div
        v-else
        class="reviews-list"
      >
        <div 
          v-for="(review, index) in reviews" 
          :key="review.id"
          class="review-item py-6"
          :class="[{ 'border-b': index !== reviews.length - 1 }]"
        >
          <div class="d-flex justify-space-between align-start flex-wrap gap-4 mb-3">
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="40"
              >
                {{ review.customer_name?.charAt(0) || 'P' }}
              </VAvatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ review.customer_name }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatDate(review.created_at) }}
                </div>
              </div>
            </div>
            <VRating
              :model-value="review.rating"
              readonly
              density="compact"
              color="amber"
              active-color="amber"
              half-increments
              size="20"
            />
          </div>
          
          <p class="text-body-1 text-slate-700 mb-4">
            {{ review.review || 'No written feedback provided.' }}
          </p>

          <!-- Provider Response Display -->
          <div
            v-if="review.provider_response && respondingTo !== review.id"
            class="ml-10 pa-4 bg-var-theme-background rounded-lg border-s-4 border-primary"
          >
            <div class="d-flex align-center gap-2 mb-1">
              <VIcon
                icon="tabler-corner-down-right"
                size="18"
                color="primary"
              />
              <span class="text-subtitle-2 font-weight-bold text-primary">Your Response</span>
              <span class="text-caption text-medium-emphasis">• {{ formatDate(review.responded_at) }}</span>
              <VSpacer />
              <VBtn
                icon
                variant="text"
                size="x-small"
                density="comfortable"
                @click="startResponse(review)"
              >
                <VIcon
                  icon="tabler-edit"
                  size="14"
                />
              </VBtn>
            </div>
            <p class="text-body-2 mb-0">
              {{ review.provider_response }}
            </p>
          </div>

          <!-- Response Input -->
          <div
            v-if="respondingTo === review.id"
            class="ml-10 mt-2"
          >
            <VTextarea
              v-model="responseText"
              placeholder="Type your response here... (e.g. Thanks for the feedback! 😊)"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
              class="mb-2"
              hide-details
            />
            <div class="d-flex gap-2">
              <VBtn
                size="small"
                color="primary"
                :loading="submittingResponse"
                @click="submitResponse(review.id)"
              >
                Submit Response
              </VBtn>
              <VBtn
                size="small"
                variant="text"
                @click="respondingTo = null"
              >
                Cancel
              </VBtn>
            </div>
          </div>

          <!-- Initial Respond Button -->
          <div
            v-else-if="!review.provider_response"
            class="ml-10"
          >
            <VBtn
              prepend-icon="tabler-message-2"
              variant="tonal"
              size="small"
              color="secondary"
              @click="startResponse(review)"
            >
              Respond to customer
            </VBtn>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.review-item {
  transition: background-color 0.2s ease;
}
.review-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.01);
}
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.bg-var-theme-background {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
