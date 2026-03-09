<script setup>
import { ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const props = defineProps({
  visitId: {
    type: String,
    required: true,
  },
})

const store = useVeterinaryStore()
const preVisitForm = ref(null)
const loading = ref(false)
const showLinkDialog = ref(false)
const publicLink = ref('')

const fetchForm = async () => {
  loading.value = true
  try {
    const forms = await store.fetchPreVisitForms(props.visitId)

    preVisitForm.value = forms.length > 0 ? forms[0] : null
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const generateLink = async () => {
  loading.value = true
  try {
    const newForm = await store.createPreVisitForm(props.visitId)

    preVisitForm.value = newForm
    
    // Construct public link
    const baseUrl = window.location.origin

    publicLink.value = `${baseUrl}/public/check-in/${newForm.access_token}`
    showLinkDialog.value = true
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const copyLink = () => {
  navigator.clipboard.writeText(publicLink.value)

  // Add a toast or snackbar notification if available
}

onMounted(fetchForm)
</script>

<template>
  <VCard
    class="border mb-6"
    elevation="0"
  >
    <VCardTitle class="d-flex justify-space-between align-center px-4 py-3">
      <div class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-clipboard-check"
          color="primary"
        />
        <span class="text-h6 font-weight-bold">Pre-Visit Check-In</span>
      </div>
      <VBtn 
        v-if="!preVisitForm" 
        color="primary" 
        variant="tonal" 
        size="small" 
        prepend-icon="tabler-link"
        :loading="loading"
        @click="generateLink"
      >
        Generate Link
      </VBtn>
    </VCardTitle>

    <VDivider />

    <VCardText class="pa-4">
      <div v-if="preVisitForm">
        <div
          v-if="preVisitForm.is_submitted"
          class="animate__animated animate__fadeIn"
        >
          <VAlert
            type="success"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            Form submitted on {{ new Date(preVisitForm.submitted_at).toLocaleString() }}
          </VAlert>

          <div class="bg-grey-lighten-4 pa-4 rounded-lg">
            <VRow dense>
              <VCol
                v-for="(val, key) in preVisitForm.data"
                :key="key"
                cols="12"
                sm="6"
              >
                <div class="text-caption text-uppercase text-medium-emphasis font-weight-bold mb-1">
                  {{ key.replace(/_/g, ' ') }}
                </div>
                <div class="text-body-2 mb-3">
                  {{ val || 'Not provided' }}
                </div>
              </VCol>
            </VRow>
          </div>
        </div>

        <div
          v-else
          class="text-center py-4"
        >
          <VIcon
            icon="tabler-clock-share"
            size="48"
            color="medium-emphasis"
            class="mb-2"
          />
          <p class="text-body-2 text-medium-emphasis mb-4">
            Link generated. Waiting for owner to submit.
          </p>
          <VBtn 
            variant="outlined" 
            size="small" 
            prepend-icon="tabler-copy"
            @click="publicLink = `${window.location.origin}/public/check-in/${preVisitForm.access_token}`; showLinkDialog = true"
          >
            Show Link
          </VBtn>
        </div>
      </div>

      <div
        v-else
        class="text-center py-6 text-medium-emphasis"
      >
        <p class="text-body-2">
          No pre-visit form generated yet.
        </p>
      </div>
    </VCardText>

    <!-- Link Dialog -->
    <VDialog
      v-model="showLinkDialog"
      max-width="500"
    >
      <VCard class="rounded-xl pa-4">
        <VCardTitle class="text-h5 font-weight-bold">
          Share Check-In Link
        </VCardTitle>
        <VCardText class="pt-2">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Send this link to the pet owner. They can fill out their pet's history before the visit.
          </p>
          <VTextField
            v-model="publicLink"
            readonly
            variant="filled"
            rounded="lg"
            append-inner-icon="tabler-copy"
            @click:append-inner="copyLink"
          />
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="showLinkDialog = false"
          >
            Close
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            @click="copyLink"
          >
            Copy Link
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>
