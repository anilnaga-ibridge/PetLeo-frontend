<script setup>
import { ref, computed, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'
import SlotPreviewDialog from './SlotPreviewDialog.vue'

const props = defineProps({
  initialTab: { type: String, default: 'PENDING' },
})

const items = ref([])
const activeTab = ref('PENDING')
const loading = ref(false)
const rejectDialog = ref(false)
const rejectReason = ref('')
const targetScheduleId = ref(null)
const processingIds = ref(new Set())
const snackbar = ref({ show: false, text: '', color: 'success' })

const showPreview = ref(false)
const previewData = ref({ employeeId: '', employeeName: '', date: '' })

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const showSnack = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const fetchSchedules = async () => {
  loading.value = true
  try {
    // Fetch all schedules for the provider's organization
    const res = await providerApi.get('/api/provider/schedules/')

    items.value = res.data
  } catch (err) {
    console.error('Failed to fetch schedules:', err)
  } finally {
    loading.value = false
  }
}

// Group schedules by employee
const groupedByEmployee = computed(() => {
  const groups = {}
  const filtered = items.value.filter(s => s.status === activeTab.value)
  
  filtered.forEach(sched => {
    const empId = sched.employee
    const empName = sched.employee_name
    if (!groups[empId]) {
      groups[empId] = { empId, empName, schedules: [] }
    }
    groups[empId].schedules.push(sched)
  })
  
  return Object.values(groups)
})

const approveAll = async group => {
  const ids = group.schedules.map(s => s.id)

  ids.forEach(id => processingIds.value.add(id))
  try {
    await Promise.all(ids.map(id =>
      providerApi.patch(`/api/provider/schedules/${id}/approve/`),
    ))
    showSnack(`${group.empName}'s schedule approved!`, 'success')
    await fetchSchedules()
  } catch (err) {
    showSnack('Approval failed.', 'error')
  } finally {
    ids.forEach(id => processingIds.value.delete(id))
  }
}

const openRejectDialog = scheduleId => {
  targetScheduleId.value = scheduleId
  rejectReason.value = ''
  rejectDialog.value = true
}

const rejectAll = async group => {
  const ids = group.schedules.map(s => s.id)

  ids.forEach(id => processingIds.value.add(id))
  try {
    await Promise.all(ids.map(id =>
      providerApi.patch(`/api/provider/schedules/${id}/reject/`, {
        rejection_reason: rejectReason.value || 'Schedule not acceptable. Please resubmit.',
      }),
    ))
    showSnack(`${group.empName}'s schedule rejected.`, 'warning')
    rejectDialog.value = false
    await fetchSchedules()
  } catch (err) {
    showSnack('Rejection failed.', 'error')
  } finally {
    ids.forEach(id => processingIds.value.delete(id))
  }
}

const formatTime = t => t ? t.substring(0, 5) : '—'

const openPreview = sched => {
  previewData.value = {
    employeeId: sched.employee,
    employeeName: sched.employee_name,
    date: sched.date,
    startTime: formatTime(sched.start_time),
    endTime: formatTime(sched.end_time),
  }
  showPreview.value = true
}

onMounted(fetchSchedules)
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <VTabs
        v-model="activeTab"
        color="primary"
        align-tabs="start"
        class="border-b"
        style="width: 100%"
      >
        <VTab
          value="PENDING"
          class="font-weight-black"
        >
          <VIcon
            icon="tabler-hourglass-high"
            size="18"
            class="mr-2"
          />
          Pending Approvals
          <VChip
            v-if="items.filter(s => s.status === 'PENDING').length > 0"
            size="x-small"
            color="error"
            class="ml-2"
          >
            {{ items.filter(s => s.status === 'PENDING').length }}
          </VChip>
        </VTab>
        <VTab
          value="APPROVED"
          class="font-weight-black"
        >
          <VIcon
            icon="tabler-circle-check"
            size="18"
            class="mr-2"
          />
          Approved History
        </VTab>
        <VTab
          value="REJECTED"
          class="font-weight-black"
        >
          <VIcon
            icon="tabler-circle-x"
            size="18"
            class="mr-2"
          />
          Rejected
        </VTab>
      </VTabs>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && groupedByEmployee.length === 0"
      class="text-center py-12"
    >
      <VIcon
        :icon="activeTab === 'PENDING' ? 'tabler-circle-check' : 'tabler-calendar-off'"
        size="56"
        color="success"
        class="mb-4 opacity-40"
      />
      <h3 class="text-h5 font-weight-bold text-slate-700">
        {{ activeTab === 'PENDING' ? 'All caught up!' : 'No records found' }}
      </h3>
      <p class="text-body-2 text-slate-400 mt-2">
        {{ activeTab === 'PENDING' ? 'No pending schedule approvals from your team.' : `You haven't ${activeTab.toLowerCase()} any schedules yet.` }}
      </p>
    </div>

    <VProgressLinear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-6"
    />

    <!-- Employee Groups -->
    <div
      v-for="group in groupedByEmployee"
      :key="group.empId"
      class="mb-6 approval-card"
    >
      <VCard
        flat
        border
        class="rounded-2xl overflow-hidden"
      >
        <!-- Employee Header -->
        <div class="d-flex align-center justify-space-between pa-6 border-b bg-slate-50">
          <div class="d-flex align-center gap-4">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
            >
              <VIcon icon="tabler-user" />
            </VAvatar>
            <div>
              <div class="text-subtitle-1 font-weight-black text-slate-800">
                {{ group.empName }}
              </div>
              <div class="text-caption text-slate-400">
                {{ group.schedules.length }} days submitted
              </div>
            </div>
          </div>
          <div
            v-if="activeTab === 'PENDING'"
            class="d-flex gap-3"
          >
            <VBtn
              variant="tonal"
              color="error"
              size="small"
              :loading="processingIds.has(group.schedules[0]?.id)"
              @click="openRejectDialog(group.schedules[0]?.id); targetGroup = group"
            >
              <VIcon
                icon="tabler-x"
                class="mr-1"
              />
              Reject All
            </VBtn>
            <VBtn
              color="success"
              size="small"
              :loading="processingIds.has(group.schedules[0]?.id)"
              @click="approveAll(group)"
            >
              <VIcon
                icon="tabler-check"
                class="mr-1"
              />
              Approve All
            </VBtn>
          </div>
          <div v-else>
            <VChip
              :color="activeTab === 'APPROVED' ? 'success' : 'error'"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ activeTab }}
            </VChip>
          </div>
        </div>

        <!-- Days List -->
        <VTable density="compact">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Hours</th>
              <th>Reason</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sched in group.schedules.sort((a,b) => new Date(a.date) - new Date(b.date))"
              :key="sched.id"
            >
              <td class="font-weight-bold">
                {{ sched.date }}
              </td>
              <td>
                <VChip
                  v-if="sched.start_time === sched.end_time"
                  size="x-small"
                  color="secondary"
                  variant="tonal"
                >
                  Off
                </VChip>
                <VChip
                  v-else
                  size="x-small"
                  color="success"
                  variant="tonal"
                >
                  Working
                </VChip>
              </td>
              <td>
                <span v-if="sched.start_time !== sched.end_time">
                  {{ formatTime(sched.start_time) }} - {{ formatTime(sched.end_time) }}
                  <VChip
                    size="x-small"
                    color="primary"
                    variant="text"
                    class="ml-1"
                  >
                    ({{
                      (() => {
                        const [sh, sm] = sched.start_time.split(':').map(Number)
                        const [eh, em] = sched.end_time.split(':').map(Number)
                        const mins = (eh * 60 + em) - (sh * 60 + sm)
                        const h = Math.floor(mins / 60), m = mins % 60
                        return m > 0 ? `${h}h ${m}m` : `${h}h`
                      })()
                    }})
                  </VChip>
                </span>
                <span
                  v-else
                  class="text-slate-400"
                >—</span>
              </td>
              <td>
                <div
                  class="text-caption text-truncate"
                  style="max-width: 250px"
                  :title="sched.reason"
                >
                  {{ sched.reason || '—' }}
                </div>
              </td>
              <td>
                <VBtn
                  v-if="sched.start_time !== sched.end_time"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  @click="openPreview(sched)"
                >
                  <VIcon
                    icon="tabler-eye"
                    size="14"
                    class="mr-1"
                  />
                  Slots
                </VBtn>
                <div
                  v-else
                  class="text-caption text-slate-300"
                >
                  N/A
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </div>

    <!-- Reject Dialog -->
    <VDialog
      v-model="rejectDialog"
      max-width="480"
    >
      <VCard title="Reject Schedule">
        <VCardText>
          <VTextarea
            v-model="rejectReason"
            label="Reason for Rejection (shown to employee)"
            placeholder="e.g. Please adjust Friday hours to start at 10:00."
            rows="3"
            variant="outlined"
          />
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="rejectDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            @click="rejectAll(targetGroup)"
          >
            Confirm Reject
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
    </VSnackbar>

    <SlotPreviewDialog
      v-model="showPreview"
      :employee-id="previewData.employeeId"
      :employee-name="previewData.employeeName"
      :date="previewData.date"
      :start-time="previewData.startTime"
      :end-time="previewData.endTime"
    />
  </div>
</template>

<script>
const targetGroup = null
</script>
