<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const route = useRoute()
const store = useVeterinaryStore()
const token = route.params.token

const loading = ref(true)
const form = ref(null)
const error = ref(null)
const submitted = ref(false)

const formData = ref({
  reason_for_visit: '',
  symptoms_duration: '',
  current_medications: '',
  allergies: '',
  diet: '',
  last_meal_time: '',
  other_concerns: '',
})

onMounted(async () => {
  try {
    form.value = await store.fetchPublicPreVisitForm(token)
    if (form.value.is_submitted) {
      submitted.value = true
    }
  } catch (err) {
    error.value = 'This check-in link is invalid or has expired.'
    console.error(err)
  } finally {
    loading.value = false
  }
})

const submitForm = async () => {
  loading.value = true
  try {
    await store.submitPublicPreVisitForm(token, formData.value)
    submitted.value = true
  } catch (err) {
    error.value = 'Failed to submit the form. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VContainer
    fluid
    class="fill-height bg-grey-lighten-4 pa-0"
  >
    <VRow
      no-gutters
      justify="center"
      align="center"
      class="fill-height"
    >
      <VCol
        cols="12"
        sm="8"
        md="6"
        lg="4"
        class="pa-4"
      >
        <!-- Header / Logo Area -->
        <div class="text-center mb-8">
          <VAvatar
            color="primary"
            size="64"
            class="elevation-4 mb-4"
          >
            <VIcon
              icon="tabler-stethoscope"
              size="32"
              color="white"
            />
          </VAvatar>
          <h1 class="text-h4 font-weight-bold text-primary">
            Clinic Check-In
          </h1>
          <p class="text-medium-emphasis mt-2">
            Please provide some details for your pet's visit.
          </p>
        </div>

        <!-- Success State -->
        <VCard
          v-if="submitted"
          class="elevation-12 rounded-xl overflow-hidden animate__animated animate__fadeIn"
        >
          <VCardText class="pa-12 text-center">
            <VIcon
              icon="tabler-circle-check"
              size="80"
              color="success"
              class="mb-6"
            />
            <h2 class="text-h4 font-weight-bold mb-4">
              Check-In Successful!
            </h2>
            <p class="text-body-1 text-medium-emphasis mb-8">
              Thank you for providing the details for <strong>{{ form?.pet_name }}</strong>. 
              Our team will review this information before your arrival.
            </p>
            <VBtn
              color="primary"
              block
              size="large"
              rounded="pill"
              variant="flat"
              href="/"
            >
              Done
            </VBtn>
          </VCardText>
        </VCard>

        <!-- Form State -->
        <VCard
          v-else-if="!loading && !error"
          class="elevation-12 rounded-xl overflow-hidden animate__animated animate__fadeInUp"
        >
          <div class="bg-primary pa-6 text-white text-center">
            <div class="text-overline mb-1 opacity-75">
              Appointment for
            </div>
            <div class="text-h5 font-weight-bold">
              {{ form?.pet_name }}
            </div>
            <div class="text-caption opacity-75 mt-1">
              {{ form?.owner_name }}
            </div>
          </div>

          <VCardText class="pa-6 pa-md-10">
            <VForm @submit.prevent="submitForm">
              <VRow>
                <VCol cols="12">
                  <VLabel class="mb-2 font-weight-bold text-body-2">
                    What is the main reason for today's visit?
                  </VLabel>
                  <VTextarea
                    v-model="formData.reason_for_visit"
                    placeholder="e.g. Skin issues, lethargy, annual vaccination..."
                    variant="outlined"
                    rows="2"
                    bg-color="white"
                    hide-details="auto"
                    class="mb-6"
                  />
                </VCol>

                <VCol cols="12">
                  <VLabel class="mb-2 font-weight-bold text-body-2">
                    How long have you noticed these symptoms?
                  </VLabel>
                  <VTextField
                    v-model="formData.symptoms_duration"
                    placeholder="e.g. 2 days, since morning..."
                    variant="outlined"
                    bg-color="white"
                    hide-details="auto"
                    class="mb-6"
                    prepend-inner-icon="tabler-clock-hour-4"
                  />
                </VCol>

                <VCol cols="12">
                  <VLabel class="mb-2 font-weight-bold text-body-2">
                    Is {{ form?.pet_name }} currently on any medications?
                  </VLabel>
                  <VTextarea
                    v-model="formData.current_medications"
                    placeholder="Please list medication names and dosages if any"
                    variant="outlined"
                    rows="2"
                    bg-color="white"
                    hide-details="auto"
                    class="mb-6"
                  />
                </VCol>

                <VCol cols="12">
                  <VLabel class="mb-2 font-weight-bold text-body-2">
                    Known Allergies
                  </VLabel>
                  <VTextField
                    v-model="formData.allergies"
                    placeholder="e.g. Chicken, Penicillin, None"
                    variant="outlined"
                    bg-color="white"
                    hide-details="auto"
                    class="mb-6"
                    prepend-inner-icon="tabler-alert-circle"
                  />
                </VCol>

                <VCol cols="12">
                  <VLabel class="mb-2 font-weight-bold text-body-2">
                    When was the last meal time?
                  </VLabel>
                  <VTextField
                    v-model="formData.last_meal_time"
                    placeholder="e.g. 8:00 AM"
                    variant="outlined"
                    bg-color="white"
                    hide-details="auto"
                    class="mb-8"
                    prepend-inner-icon="tabler-tools-kitchen-2"
                  />
                </VCol>

                <VCol cols="12">
                  <VBtn
                    type="submit"
                    color="primary"
                    block
                    size="x-large"
                    rounded="pill"
                    elevation="4"
                    :loading="loading"
                    class="font-weight-bold text-uppercase letter-spacing-1"
                  >
                    Complete Check-In
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>

        <!-- Loading / Error States -->
        <VCard
          v-else
          class="elevation-12 rounded-xl text-center pa-12"
        >
          <div v-if="loading">
            <VProgressCircular
              indeterminate
              color="primary"
              size="64"
              width="6"
              class="mb-6"
            />
            <p class="text-h6 text-medium-emphasis">
              Preparing your check-in form...
            </p>
          </div>
          <div v-else-if="error">
            <VIcon
              icon="tabler-circle-x"
              size="80"
              color="error"
              class="mb-6"
            />
            <h2 class="text-h5 font-weight-bold mb-4">
              Access Denied
            </h2>
            <p class="text-body-1 text-medium-emphasis">
              {{ error }}
            </p>
          </div>
        </VCard>

        <!-- Footer -->
        <div class="text-center mt-8 text-caption text-medium-emphasis">
          Powered by PetLeo Health System &bull; &copy; 2025
        </div>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped>
.v-container {
  min-height: 100vh;
}

.animate__animated {
  animation-duration: 0.6s;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}
</style>
