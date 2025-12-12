<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import {
  VCard, VCardTitle, VCardText, VCardItem, VCardSubtitle, VDivider,
  VDataTable, VBtn, VIcon, VChip, VDialog, VCardActions, VTextarea,
  VSnackbar, VAvatar
} from 'vuetify/components'

// =============================
// 🔹 API Endpoints
// =============================
const API_BASE = 'http://127.0.0.1:8003/api/superadmin/verification/documents/'

// =============================
// 🔹 State
// =============================
const documents = ref([])
const loading = ref(false)
const processing = ref(false)
const showSnack = ref(false)
const snackMessage = ref('')
const snackColor = ref('success')

// Reject dialog
const isRejectDialogVisible = ref(false)
const selectedDoc = ref(null)
const rejectionReason = ref('')

const tokenHeader = () => {
  const token = useCookie('accessToken').value
  return { Authorization: `Bearer ${token}` }
}

const openSnack = (msg, color = 'success') => {
  snackMessage.value = msg
  snackColor.value = color
  showSnack.value = true
}

// =============================
// 🔥 Fetch docs + provider info
// =============================
const fetchDocuments = async () => {
  loading.value = true
  try {
    const res = await axios.get(API_BASE, {
      headers: tokenHeader(),
    })

    const docs = res.data
console.log("Fetched docs:", docs)
    // Enrich each doc
    const enriched = await Promise.all(
      docs.map(async doc => {
        const providerId = doc.auth_user_id
        console.log("Fetching info for provider ID:", providerId)

        let role = doc.provider_role || 'Unknown'
        let providerName = doc.provider_name || 'Unknown'

        // Fetch profile (includes role_name now)
        try {
          const p = await axios.get(
            `http://127.0.0.1:8000/auth/users/${providerId}/`,
            { headers: tokenHeader() }
          )
          providerName = p.data?.full_name || 'Unknown'
          role = p.data?.role_name || role
        } catch (err) {
          console.warn("Profile fetch failed", err)
        }

        return {
          ...doc,
          provider_role: role,
          provider_name: providerName,
        }
      })
    )

    documents.value = enriched

  } catch (err) {
    console.error(err)
    openSnack('Failed to load documents.', 'error')
  } finally {
    loading.value = false
  }
}

// =============================
// 🔹 Approve
// =============================
const approveDocument = async (doc) => {
  if (!confirm(`Approve ${doc.filename}?`)) return

  processing.value = true
  try {
    await axios.post(
      `${API_BASE}${doc.id}/verify/`,
      { status: 'approved' },
      { headers: tokenHeader() }
    )
    openSnack('Document approved!')
    fetchDocuments()
  } catch (err) {
    openSnack('Approval failed!', 'error')
  } finally {
    processing.value = false
  }
}

// =============================
// 🔹 Reject
// =============================
const openRejectDialog = (doc) => {
  selectedDoc.value = doc
  rejectionReason.value = ''
  isRejectDialogVisible.value = true
}

const rejectDocument = async () => {
  if (!rejectionReason.value.trim()) {
    openSnack('Enter a rejection reason!', 'warning')
    return
  }

  processing.value = true
  try {
    await axios.post(
      `${API_BASE}${selectedDoc.value.id}/verify/`,
      {
        status: 'rejected',
        rejection_reason: rejectionReason.value,
      },
      { headers: tokenHeader() }
    )
    openSnack('Document rejected.')
    isRejectDialogVisible.value = false
    fetchDocuments()
  } catch (err) {
    openSnack('Rejection failed!', 'error')
  } finally {
    processing.value = false
  }
}

onMounted(fetchDocuments)

const headers = [
  { title: 'Filename', key: 'filename' },
  { title: 'Provider Name', key: 'provider_name' },
  { title: 'Role', key: 'provider_role' },
  { title: 'Uploaded At', key: 'created_at' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const resolveStatusColor = (status) => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}
</script>

<template>
  <section>
    <VCard>
      <VCardItem>
        <VCardTitle>Document Verification</VCardTitle>
        <VCardSubtitle>Review provider documents</VCardSubtitle>
      </VCardItem>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="documents"
        :loading="loading"
        item-key="id"
      >
        <template #item.filename="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VAvatar color="primary" variant="tonal">
              <VIcon icon="tabler-file" />
            </VAvatar>
            <a :href="item.file_url" target="_blank" class="text-primary">
              {{ item.filename }}
            </a>
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip :color="resolveStatusColor(item.status)" size="small" class="text-capitalize">
            {{ item.status }}
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>

        <template #item.actions="{ item }">
          <VBtn icon color="success" variant="text" @click="approveDocument(item)">
            <VIcon icon="tabler-check" />
          </VBtn>

          <VBtn icon color="error" variant="text" @click="openRejectDialog(item)">
            <VIcon icon="tabler-x" />
          </VBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Reject Modal -->
    <VDialog v-model="isRejectDialogVisible" max-width="450">
      <VCard>
        <VCardTitle class="bg-error text-white">Reject Document</VCardTitle>
        <VCardText>
          <p>Reason for rejecting <b>{{ selectedDoc?.filename }}</b>:</p>
          <VTextarea v-model="rejectionReason" label="Reason" rows="3" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="text" @click="isRejectDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="rejectDocument" :loading="processing">Reject</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="showSnack" :color="snackColor" timeout="3000">
      {{ snackMessage }}
    </VSnackbar>
  </section>
</template>
