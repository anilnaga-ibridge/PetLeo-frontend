import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePetOwnerProviderStore = defineStore('petOwnerProvider', () => {
  const activeProvider = ref(null)
  const reviews = ref([])
  const reviewsLoading = ref(false)

  // Dialog visibility states
  const showCertsDialog = ref(false)
  const showPoliciesDialog = ref(false)

  const setActiveProvider = provider => {
    activeProvider.value = provider
  }

  const setReviews = data => {
    reviews.value = data
  }

  const setReviewsLoading = loading => {
    reviewsLoading.value = loading
  }

  return {
    activeProvider,
    reviews,
    reviewsLoading,
    showCertsDialog,
    showPoliciesDialog,
    setActiveProvider,
    setReviews,
    setReviewsLoading,
  }
})
