<script setup>
import { inject } from 'vue'

const provider = inject('provider')
const reviews = inject('reviews')
const reviewsLoading = inject('reviewsLoading')
const showRatingDialog = inject('showRatingDialog')
</script>

<template>
  <div
    v-if="provider"
    class="reviews-page"
  >
    <div
      id="reviews-section"
      class="mb-12"
    >
      <div class="section-title-bar d-flex align-center justify-space-between mb-8 pa-6 rounded-xl bg-gradient-amber">
        <div>
          <h2 class="text-h4 font-weight-black text-white mb-1">
            Customer Experience
          </h2>
          <p class="text-body-2 text-white opacity-90 mb-0">
            What pet owners are saying about {{ provider.full_name }}
          </p>
        </div>
        <VIcon
          icon="tabler-message-star"
          size="48"
          color="white"
          class="opacity-20"
        />
      </div>

      <VCard
        flat
        border
        class="rounded-xl pa-8"
      >
        <div
          v-if="reviewsLoading"
          class="text-center py-12"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>
        <div
          v-else-if="reviews.length === 0"
          class="text-center py-12"
        >
          <VIcon
            icon="tabler-message-off"
            size="56"
            color="slate-200"
            class="mb-3"
          />
          <p class="text-h6 text-slate-400">
            No reviews yet
          </p>
          <VBtn
            variant="text"
            color="primary"
            @click="showRatingDialog = true"
          >
            Be the first to rate!
          </VBtn>
        </div>
        <div
          v-else
          class="reviews-list-neat"
        >
          <div 
            v-for="(review, index) in reviews" 
            :key="review.id"
            class="py-6"
            :class="{ 'border-b': index !== reviews.length - 1 }"
          >
            <div class="d-flex justify-space-between align-start mb-4">
              <div class="d-flex align-center gap-3">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="40"
                >
                  {{ review.customer_name?.charAt(0) || 'P' }}
                </VAvatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold text-slate-900">
                    {{ review.customer_name }}
                  </div>
                  <div class="text-caption text-slate-400">
                    {{ new Date(review.created_at).toLocaleDateString() }}
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
            <p class="text-body-1 text-slate-600 mb-4 px-2">
              {{ review.review || 'No written feedback provided.' }}
            </p>

            <!-- Provider Response -->
            <div
              v-if="review.provider_response"
              class="provider-reply-box ml-10 pa-5 bg-slate-50 rounded-lg border-s-4 border-primary"
            >
              <div class="d-flex align-center gap-2 mb-2">
                <VIcon
                  icon="tabler-corner-down-right"
                  size="18"
                  color="primary"
                />
                <span class="text-subtitle-2 font-weight-bold text-primary">Response from Provider</span>
              </div>
              <p class="text-body-2 text-slate-700 mb-0 italic">
                "{{ review.provider_response }}"
              </p>
            </div>
          </div>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.text-white { color: white !important; }
.opacity-90 { opacity: 0.9; }
.opacity-20 { opacity: 0.2; }
.bg-gradient-amber {
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  box-shadow: 0 8px 32px rgba(251, 191, 36, 0.25);
}
.border-b { border-bottom: 1px solid #f1f5f9; }
</style>
