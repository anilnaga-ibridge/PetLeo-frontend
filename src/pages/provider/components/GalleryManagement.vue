
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const galleryItems = ref([])
const loading = ref(false)
const uploading = ref(false)
const imageFile = ref(null)
const caption = ref('')

const fetchGallery = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/my-gallery/')

    galleryItems.value = res.data
  } catch (err) {
    console.error('Failed to fetch gallery', err)
  } finally {
    loading.value = false
  }
}

const handleFileUpload = e => {
  imageFile.value = e.target.files[0]
}

const uploadImage = async () => {
  if (!imageFile.value) return
    
  uploading.value = true

  const formData = new FormData()

  formData.append('image', imageFile.value)
  formData.append('caption', caption.value)
    
  try {
    const res = await providerApi.post('/api/provider/my-gallery/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    galleryItems.value.push(res.data)
    imageFile.value = null
    caption.value = ''
  } catch (err) {
    console.error('Failed to upload image', err)
  } finally {
    uploading.value = false
  }
}

const deleteImage = async id => {
  try {
    await providerApi.delete(`/api/provider/my-gallery/${id}/`)
    galleryItems.value = galleryItems.value.filter(item => item.id !== id)
  } catch (err) {
    console.error('Failed to delete image', err)
  }
}

onMounted(fetchGallery)
</script>

<template>
  <VCard
    title="Professional Gallery"
    subtitle="Showcase your work, clinic environment, or success stories with a high-quality gallery."
  >
    <VCardText>
      <!-- Upload -->
      <div class="mb-8 border-dashed border-2 rounded-xl pa-6 text-center bg-slate-50">
        <VIcon
          icon="tabler-photo-plus"
          size="48"
          color="primary"
          class="mb-4"
        />
        <VRow justify="center">
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="caption"
              label="Caption (Optional)"
              placeholder="e.g. Our state-of-the-art surgery room"
              class="mb-4"
            />
            <VFileInput 
              label="Select Image" 
              accept="image/*"
              density="compact"
              class="mb-4"
              @change="handleFileUpload"
            />
            <VBtn
              :loading="uploading"
              color="primary"
              @click="uploadImage"
            >
              Upload Image
            </VBtn>
          </VCol>
        </VRow>
      </div>

      <VCardText
        v-if="loading"
        class="text-center"
      >
        <VProgressCircular indeterminate />
      </VCardText>
      
      <VRow v-else>
        <VCol
          v-for="item in galleryItems"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <VCard class="overflow-hidden border rounded-lg h-100">
            <VImg
              :src="item.image"
              cover
              height="180"
            />
            <VCardText class="pa-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption truncate-text pe-2">{{ item.caption || 'No caption' }}</span>
                <VBtn
                  variant="text"
                  color="error"
                  icon="tabler-trash"
                  size="x-small"
                  @click="deleteImage(item.id)"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>
        
        <VCol
          v-if="galleryItems.length === 0"
          cols="12"
          class="text-center pa-12"
        >
          <p class="text-slate-400">
            No images in your gallery yet.
          </p>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
