
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const certifications = ref([])
const loading = ref(false)
const uploading = ref(false)
const newCert = ref({ title: '', issued_by: '', issue_date: '', expiry_date: '' })
const certFile = ref(null)

const fetchCerts = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/my-certifications/')

    certifications.value = res.data
  } catch (err) {
    console.error('Failed to fetch certs', err)
  } finally {
    loading.value = false
  }
}

const handleFileUpload = e => {
  certFile.value = e.target.files[0]
}

const addCert = async () => {
  if (!certFile.value || !newCert.value.title) return
    
  uploading.value = true

  const formData = new FormData()

  formData.append('title', newCert.value.title)
  formData.append('issued_by', newCert.value.issued_by)
  formData.append('issue_date', newCert.value.issue_date)
  formData.append('expiry_date', newCert.value.expiry_date)
  formData.append('document', certFile.value)
    
  try {
    const res = await providerApi.post('/api/provider/my-certifications/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    certifications.value.push(res.data)
    newCert.value = { title: '', issued_by: '', issue_date: '', expiry_date: '' }
    certFile.value = null
  } catch (err) {
    console.error('Failed to add cert', err)
  } finally {
    uploading.value = false
  }
}

const deleteCert = async id => {
  try {
    await providerApi.delete(`/api/provider/my-certifications/${id}/`)
    certifications.value = certifications.value.filter(c => c.id !== id)
  } catch (err) {
    console.error('Failed to delete cert', err)
  }
}

onMounted(fetchCerts)
</script>

<template>
  <VCard
    title="Certifications & Documents"
    subtitle="Upload professional certificates and licenses to build trust with pet owners."
  >
    <VCardText>
      <!-- Add New -->
      <VForm
        class="mb-8 border rounded-xl pa-4 bg-slate-50"
        @submit.prevent="addCert"
      >
        <h6 class="text-h6 mb-4">
          Add New Certification
        </h6>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="newCert.title"
              label="Title"
              placeholder="e.g. Veterinary License"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="newCert.issued_by"
              label="Issued By"
              placeholder="e.g. State Board"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="newCert.issue_date"
              type="date"
              label="Issue Date"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="newCert.expiry_date"
              type="date"
              label="Expiry Date"
            />
          </VCol>
          <VCol cols="12">
            <VFileInput 
              label="Certification Document (PDF/Image)" 
              prepend-icon="tabler-file-upload"
              accept=".pdf,image/*"
              density="compact"
              @change="handleFileUpload"
            />
          </VCol>
          <VCol cols="12">
            <VBtn
              :loading="uploading"
              type="submit"
              color="primary"
            >
              Add Document
            </VBtn>
          </VCol>
        </VRow>
      </VForm>

      <VDivider class="mb-6" />

      <!-- List -->
      <VCardText
        v-if="loading"
        class="text-center"
      >
        <VProgressCircular indeterminate />
      </VCardText>
      
      <VRow v-else>
        <VCol
          v-for="cert in certifications"
          :key="cert.id"
          cols="12"
          sm="6"
        >
          <VCard
            variant="tonal"
            class="pa-4 border-dashed rounded-lg"
          >
            <div class="d-flex justify-space-between align-start">
              <div>
                <h6 class="text-h6 mb-1">
                  {{ cert.title }}
                </h6>
                <p class="text-body-2 mb-0">
                  {{ cert.issued_by }}
                </p>
                <div class="text-caption text-slate-500 mt-1">
                  Issued: {{ cert.issue_date || 'N/A' }} | Expires: {{ cert.expiry_date || 'N/A' }}
                </div>
              </div>
              <div class="d-flex gap-2">
                <VBtn
                  variant="text"
                  icon="tabler-download"
                  size="small"
                  :href="cert.document"
                  target="_blank"
                />
                <VBtn
                  variant="text"
                  color="error"
                  icon="tabler-trash"
                  size="small"
                  @click="deleteCert(cert.id)"
                />
              </div>
            </div>
            
            <VChip
              v-if="cert.verified_by_admin"
              color="success"
              size="x-small"
              label
              class="mt-2"
            >
              <VIcon
                icon="tabler-check"
                size="12"
                class="me-1"
              /> Verified
            </VChip>
            <VChip
              v-else
              color="warning"
              size="x-small"
              label
              class="mt-2 text-capitalize"
            >
              Pending Verification
            </VChip>
          </VCard>
        </VCol>
        
        <VCol
          v-if="certifications.length === 0"
          cols="12"
          class="text-center pa-12"
        >
          <p class="text-slate-400">
            No certifications uploaded yet.
          </p>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
