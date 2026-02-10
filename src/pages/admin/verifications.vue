<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

definePage({
  name: 'admin-verifications',
  meta: {
    layout: 'default',
    requiresAuth: true,
    role: 'super_admin',
  },
})

const documents = ref([])
const loading = ref(false)
const processingId = ref(null)

const rejectDialog = ref(false)
const providerDialog = ref(false)
const previewDialog = ref(false)
const selectedDoc = ref(null)
const selectedProvider = ref(null)
const rejectionReason = ref('')
const previewUrl = ref('')

const copyText = (text) => {
  navigator.clipboard.writeText(text)
  // Simple check if supported, most modern browsers do
}

const openDocPreview = (doc) => {
  selectedDoc.value = doc
  const baseUrl = 'http://127.0.0.1:8003'
  previewUrl.value = doc.file_url ? (doc.file_url.startsWith('http') ? doc.file_url : `${baseUrl}${doc.file_url}`) : ''
  previewDialog.value = true
}

const openProviderDetails = (doc) => {
  selectedProvider.value = doc
  providerDialog.value = true
}

const fetchDocuments = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/verification/documents/')
    documents.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch documents:', err)
  } finally {
    loading.value = false
  }
}

const verifyDocument = async (id, status, reason = '') => {
  processingId.value = id
  try {
    const payload = { status }
    if (status === 'rejected') payload.rejection_reason = reason

    await superAdminApi.post(`/api/superadmin/verification/documents/${id}/verify/`, payload)
    
    // Remove from list or update status
    documents.value = documents.value.filter(d => d.id !== id)
    
    // Close dialogs if open
    rejectDialog.value = false
    previewDialog.value = false
    rejectionReason.value = ''
    selectedDoc.value = null
  } catch (err) {
    console.error(`Failed to ${status} document:`, err)
  } finally {
    processingId.value = null
  }
}

const openRejectDialog = (doc) => {
  selectedDoc.value = doc
  rejectionReason.value = ''
  rejectDialog.value = true
}

const confirmReject = () => {
  if (!selectedDoc.value) return
  verifyDocument(selectedDoc.value.id, 'rejected', rejectionReason.value)
}

const getStatusColor = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  }
  return map[status] || 'secondary'
}

onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div>
    <VCard title="Document Verifications" class="mb-6">
      <VCardText>
        Review and approve provider documents. Approved providers can proceed to purchase plans.
      </VCardText>
    </VCard>

    <VCard :loading="loading">
      <VTable class="text-no-wrap">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Type</th>
            <th>Filename</th>
            <th>Uploaded At</th>
            <th>Status</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id">
            <td>
              <div class="d-flex flex-column">
                <span 
                  class="font-weight-medium text-high-emphasis cursor-pointer"
                  @click="openProviderDetails(doc)"
                >
                  {{ doc.provider_name || doc.auth_user_id }}
                </span>
                <span class="text-caption text-medium-emphasis">Click for details</span>
              </div>
            </td>
            <td>
              <VChip size="small" variant="tonal" color="info">
                 {{ doc.document_type || doc.definition_id }}
              </VChip>
            </td>
            <td>
              <div 
                class="d-flex align-center text-primary cursor-pointer"
                @click="openDocPreview(doc)"
              >
                <VIcon icon="tabler-file" size="18" class="me-1" />
                {{ doc.filename }}
              </div>
            </td>
            <td class="text-medium-emphasis">
              {{ new Date(doc.uploaded_at || Date.now()).toLocaleDateString() }}
            </td>
            <td>
              <VChip :color="getStatusColor(doc.status)" size="small">
                {{ doc.status.toUpperCase() }}
              </VChip>
            </td>
            <td class="text-center">
              <div class="d-flex justify-center gap-2">
                <VBtn
                  color="success"
                  size="small"
                  variant="flat"
                  :loading="processingId === doc.id"
                  @click="verifyDocument(doc.id, 'approved')"
                >
                  Approve
                </VBtn>
                
                <VBtn
                  color="error"
                  size="small"
                  variant="outlined"
                  :loading="processingId === doc.id"
                  @click="openRejectDialog(doc)"
                >
                  Reject
                </VBtn>
              </div>
            </td>
          </tr>
          
          <tr v-if="!loading && documents.length === 0">
            <td colspan="6" class="text-center py-8 text-medium-emphasis">
              🎉 No pending documents to verify!
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Reject Dialog -->
    <VDialog v-model="rejectDialog" max-width="500">
      <VCard title="Reject Document">
        <VCardText>
          <p class="mb-4">Please provide a reason for rejecting this document. The provider will be notified.</p>
          <VTextarea
            v-model="rejectionReason"
            label="Rejection Reason"
            placeholder="e.g. Image blurry, Wrong document type..."
            auto-grow
            rows="3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="rejectDialog = false">
            Cancel
          </VBtn>
          <VBtn 
            color="error" 
            variant="flat" 
            @click="confirmReject"
            :disabled="!rejectionReason"
            :loading="processingId === selectedDoc?.id"
          >
            Reject Document
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Provider Details Dialog -->
    <VDialog v-model="providerDialog" max-width="450">
      <VCard class="overflow-visible" v-if="selectedProvider">
        <!-- Modern Header with Avatar -->
        <div 
          class="d-flex flex-column align-center py-8 rounded-t-lg bg-surface"
          style="background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0.02) 100%); position: relative;"
        >
          <VBtn
            icon="tabler-x"
            variant="text"
            size="small"
            class="position-absolute top-0 right-0 ma-2"
            @click="providerDialog = false"
          />
          
          <VAvatar
            size="80"
            color="primary"
            variant="tonal"
            class="mb-3 elevation-2 bg-white"
          >
            <span class="text-h4 font-weight-bold">
              {{ (selectedProvider.provider_name || 'U').charAt(0).toUpperCase() }}
            </span>
          </VAvatar>
          
          <h2 class="text-h5 font-weight-bold text-high-emphasis mb-1">
            {{ selectedProvider.provider_name || 'Unknown Provider' }}
          </h2>
          <VChip
            size="small"
            variant="tonal"
            :color="selectedProvider.provider_role === 'individual' ? 'info' : 'secondary'"
            class="text-capitalize"
          >
            {{ selectedProvider.provider_role }}
          </VChip>
        </div>

        <VDivider />

        <VCardText class="pa-6">
          <div class="d-flex flex-column gap-6">
            <!-- Email Section -->
            <div class="d-flex align-center">
              <VAvatar color="primary" variant="tonal" size="40" class="me-4">
                <VIcon icon="tabler-mail" size="20" />
              </VAvatar>
              <div class="flex-grow-1">
                <label class="text-caption text-medium-emphasis d-block">EMAIL ADDRESS</label>
                <div class="d-flex align-center">
                  <span class="font-weight-medium text-high-emphasis">
                    {{ selectedProvider.provider_email || 'Not Provided' }}
                  </span>
                  <VBtn
                    v-if="selectedProvider.provider_email"
                    icon="tabler-copy"
                    variant="text"
                    size="x-small"
                    class="ms-2 text-medium-emphasis"
                    @click="copyText(selectedProvider.provider_email)"
                  />
                </div>
              </div>
            </div>

            <!-- Phone Section -->
            <div class="d-flex align-center">
              <VAvatar color="success" variant="tonal" size="40" class="me-4">
                <VIcon icon="tabler-phone" size="20" />
              </VAvatar>
              <div class="flex-grow-1">
                <label class="text-caption text-medium-emphasis d-block">CONTACT NUMBER</label>
                <div class="d-flex align-center">
                  <span class="font-weight-medium text-high-emphasis">
                    {{ selectedProvider.provider_phone || 'Not Provided' }}
                  </span>
                  <VBtn
                    v-if="selectedProvider.provider_phone"
                    icon="tabler-copy"
                    variant="text"
                    size="x-small"
                    class="ms-2 text-medium-emphasis"
                    @click="copyText(selectedProvider.provider_phone)"
                  />
                </div>
              </div>
            </div>

            <!-- User ID Section -->
            <div class="d-flex align-center">
              <VAvatar color="warning" variant="tonal" size="40" class="me-4">
                <VIcon icon="tabler-id" size="20" />
              </VAvatar>
              <div class="flex-grow-1 overflow-hidden">
                <label class="text-caption text-medium-emphasis d-block">AUTH USER ID</label>
                <div class="d-flex align-center">
                  <span class="text-caption font-weight-monospace text-truncate">
                    {{ selectedProvider.auth_user_id }}
                  </span>
                  <VBtn
                    icon="tabler-copy"
                    variant="text"
                    size="x-small"
                    class="ms-2 text-medium-emphasis flex-shrink-0"
                    @click="copyText(selectedProvider.auth_user_id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </VCardText>

        <VCardActions class="pa-6 pt-0">
          <VBtn 
            block 
            variant="tonal" 
            color="primary" 
            size="large"
            @click="providerDialog = false"
          >
            Close Profile
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Document Preview Dialog -->
    <VDialog v-model="previewDialog" max-width="900" width="100%">
      <VCard>
        <VCardTitle class="d-flex align-center pr-2">
          <span>{{ selectedDoc?.filename }}</span>
          <VSpacer />
          <VBtn icon="tabler-x" variant="text" size="small" @click="previewDialog = false" />
        </VCardTitle>

        <VCardText class="pa-0" style="min-height: 500px; max-height: 80vh; overflow: auto;">
          <div v-if="previewUrl" class="d-flex justify-center bg-grey-lighten-4 py-2">
            <template v-if="previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)">
              <VImg
                :src="previewUrl"
                max-width="100%"
                contain
              />
            </template>
            <template v-else>
              <iframe
                :src="previewUrl"
                width="100%"
                style="border: none; min-height: 70vh;"
              />
            </template>
          </div>
          <div v-else class="pa-10 text-center">
            <VIcon icon="tabler-file-off" size="48" color="error" class="mb-2" />
            <p>Error: Document URL not found</p>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <div class="d-flex align-center gap-4">
            <VChip size="small" variant="tonal" color="info">
               {{ selectedDoc?.document_type || selectedDoc?.definition_id }}
            </VChip>
            <span class="text-caption text-medium-emphasis">
              Uploaded by: {{ selectedDoc?.provider_name }}
            </span>
          </div>
          <VSpacer />
          <div class="d-flex gap-2">
            <VBtn
              color="error"
              variant="outlined"
              @click="openRejectDialog(selectedDoc)"
              :loading="processingId === selectedDoc?.id"
            >
              Reject
            </VBtn>
            <VBtn
              color="success"
              variant="flat"
              @click="verifyDocument(selectedDoc?.id, 'approved')"
              :loading="processingId === selectedDoc?.id"
            >
              Approve Document
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
