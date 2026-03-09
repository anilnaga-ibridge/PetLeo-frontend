<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  provider: {
    type: Object,
    required: true,
  },
  bookingItem: {
    type: Object,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const rating = ref(0)
const review = ref('')
const loading = ref(false)
const fetchingRating = ref(false)
const error = ref('')
const success = ref(false)

const fetchExistingRating = async () => {
  if (!props.provider?.id || !props.bookingItem?.service_id) return
  
  fetchingRating.value = true
  try {
    const res = await providerApi.get('/api/provider/rating/', {
      params: {
        provider_id: props.provider.id,
        service_id: props.bookingItem.service_id,
        assigned_employee_id: props.bookingItem.assigned_employee_id || null,
      },
    })
    
    if (res.data && res.data.rating) {
      rating.value = res.data.rating
      review.value = res.data.review || ''
    }
  } catch (err) {
    console.error('Failed to fetch existing rating:', err)
  } finally {
    fetchingRating.value = false
  }
}

onMounted(() => {
  fetchExistingRating()
})

const submitReview = async () => {
  if (rating.value === 0) {
    error.value = 'Please select a star rating'
    
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const payload = {
      provider_id: props.provider.id,
      rating: rating.value,
      review: review.value,
      service_id: props.bookingItem?.service_id || null,
      assigned_employee_id: props.bookingItem?.assigned_employee_id || null,
    }
    
    const res = await providerApi.post('/api/provider/rating/', payload)
    
    success.value = true
    setTimeout(() => {
      emit('saved', res.data)
      emit('update:modelValue', false)

      // Reset after close
      setTimeout(() => {
        success.value = false
        rating.value = 0
        review.value = ''
      }, 500)
    }, 1500)
  } catch (err) {
    console.error('Failed to submit review:', err)
    error.value = err.response?.data?.error || 'Failed to submit review. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard
      rounded="xl"
      class="pa-4"
    >
      <VCardTitle class="text-h5 font-weight-bold d-flex align-center">
        <VIcon
          icon="tabler-star"
          color="amber-darken-2"
          class="mr-2"
        />
        Rate {{ provider.full_name || provider.providerName }}
        <VSpacer />
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="emit('update:modelValue', false)"
        />
      </VCardTitle>
      
      <VCardText class="pt-4">
        <div
          v-if="success"
          class="text-center py-8"
        >
          <VIcon
            icon="tabler-circle-check"
            color="success"
            size="64"
            class="mb-4"
          />
          <h3 class="text-h5 font-weight-bold mb-2">
            Thank You!
          </h3>
          <p class="text-body-1 text-slate-500">
            Your review has been submitted successfully.
          </p>
        </div>
        <template v-else>
          <div
            v-if="fetchingRating"
            class="text-center py-10"
          >
            <VProgressCircular
              indeterminate
              color="primary"
              class="mb-2"
            />
            <div class="text-caption text-slate-400">
              Loading your previous review...
            </div>
          </div>
          <template v-else>
            <div
              v-if="bookingItem"
              class="mb-6 pa-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div class="text-caption font-weight-black text-slate-400 uppercase mb-1">
                Service Rated
              </div>
              <div class="text-body-2 font-weight-bold text-slate-700">
                {{ bookingItem.service_snapshot?.name || bookingItem.service_name }}
              </div>
              <div
                v-if="bookingItem.assigned_employee_name"
                class="mt-2 text-caption text-slate-500"
              >
                Staff member: <span class="font-weight-bold">{{ bookingItem.assigned_employee_name }}</span>
              </div>
            </div>

            <div class="text-center mb-6">
              <p class="text-body-1 text-slate-600 mb-2">
                How was your experience?
              </p>
              <VRating
                v-model="rating"
                color="amber-darken-2"
                active-color="amber-darken-2"
                half-increments
                hover
                size="48"
              />
            </div>
            
            <VTextarea
              v-model="review"
              label="Describe your experience (optional)"
              placeholder="What did you like? Any tips for others?"
              variant="outlined"
              rounded="lg"
              hide-details
              rows="4"
              class="mb-4"
            />
            
            <VAlert
              v-if="error"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4 rounded-lg"
            >
              {{ error }}
            </VAlert>
          </template>
        </template>
      </VCardText>
      
      <VCardActions
        v-if="!success"
        class="pa-4"
      >
        <VBtn
          variant="text"
          color="slate-400"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VSpacer />
        <VBtn 
          color="primary" 
          variant="flat" 
          rounded="lg" 
          class="px-8" 
          height="44"
          :loading="loading"
          @click="submitReview"
        >
          Submit Review
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
