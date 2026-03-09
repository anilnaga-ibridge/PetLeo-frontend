
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'
import { useCookie } from '@/@core/composable/useCookie'

const userData = useCookie('userData')
const bannerFile = ref(null)
const bannerPreview = ref(null)
const uploading = ref(false)
const error = ref('')
const success = ref(false)
const currentBanner = ref(null)

const fetchProfile = async () => {
  try {
    const res = await providerApi.get('/api/provider/profile/')

    currentBanner.value = res.data.banner_image
  } catch (err) {
    console.error('Failed to fetch profile', err)
  }
}

const handleFileChange = e => {
  const file = e.target.files[0]
  if (file) {
    bannerFile.value = file
    bannerPreview.value = URL.createObjectURL(file)
    success.value = false
    error.value = ''
  }
}

const uploadBanner = async () => {
  if (!bannerFile.value) return
    
  uploading.value = true
  error.value = ''
  success.value = false
    
  const formData = new FormData()

  formData.append('auth_user_id', userData.value.id || userData.value.auth_user_id)
  formData.append('banner_image', bannerFile.value)
    
  try {
    await providerApi.post('/api/provider/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    success.value = true
    currentBanner.value = bannerPreview.value
    bannerFile.value = null
    bannerPreview.value = null
  } catch (err) {
    console.error('Failed to upload banner', err)
    error.value = 'Failed to upload image. Please try again.'
  } finally {
    uploading.value = false
  }
}

onMounted(fetchProfile)
</script>

<template>
  <VCard
    title="Discovery Card Banner"
    subtitle="This image will be displayed on your card in the marketplace discovery screen."
  >
    <VCardText>
      <div class="d-flex flex-column gap-6">
        <!-- Current/Preview Box -->
        <div
          class="banner-preview-area border rounded-xl overflow-hidden bg-slate-50 d-flex align-center justify-center"
          style="height: 200px; position: relative;"
        >
          <VImg 
            v-if="bannerPreview || currentBanner" 
            :src="bannerPreview || currentBanner" 
            cover 
            class="fill-height w-100"
          />
          <div
            v-else
            class="text-center pa-8"
          >
            <VIcon
              icon="tabler-photo"
              size="48"
              color="slate-300"
              class="mb-2"
            />
            <p class="text-body-2 text-slate-400">
              No banner uploaded yet. Recommended size: 600x400
            </p>
          </div>
          
          <div
            v-if="bannerPreview"
            class="preview-badge"
          >
            Preview
          </div>
        </div>

        <!-- Actions -->
        <div class="d-flex align-center flex-wrap gap-4">
          <VBtn
            color="primary"
            variant="tonal"
            prepend-icon="tabler-upload"
            :loading="uploading"
            @click="$refs.fileInput.click()"
          >
            Select Image
          </VBtn>
          
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="d-none"
            @change="handleFileChange"
          >

          <VBtn
            v-if="bannerFile"
            color="primary"
            variant="flat"
            :loading="uploading"
            @click="uploadBanner"
          >
            Save Changes
          </VBtn>

          <VBtn
            v-if="bannerFile"
            variant="text"
            color="secondary"
            @click="bannerFile = null; bannerPreview = null"
          >
            Cancel
          </VBtn>
        </div>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="rounded-lg"
        >
          {{ error }}
        </VAlert>
        
        <VAlert
          v-if="success"
          type="success"
          variant="tonal"
          density="compact"
          class="rounded-lg"
        >
          Banner updated successfully!
        </VAlert>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.banner-preview-area {
  border-style: dashed !important;
  border-width: 2px !important;
}

.preview-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(var(--v-theme-primary), 0.9);
  color: white;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}
</style>
