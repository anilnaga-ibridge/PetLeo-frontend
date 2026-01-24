<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['state', 'hideNavigation'])

const emit = defineEmits(['prev', 'update:state'])

const router = useRouter()

const plans = ref([])
const billingCycles = ref([])
const services = ref([])
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = ref({
  title: '',
  subtitle: '',
  description: '',
  target_type: 'ORGANIZATION',
  billing_cycle: 'MONTHLY',
  price: 0,
  features: [],
  is_active: true,
  capabilities: {}, // Map of serviceId -> { enabled: bool, permissions: { ... } }
})

const fetchPlans = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/plans/')

    plans.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch plans:', err)
  } finally {
    loading.value = false
  }
}

const fetchMetadata = async () => {
  try {
    const [bcRes, svcRes] = await Promise.all([
      superAdminApi.get('/api/superadmin/billing-cycles/'),
      superAdminApi.get('/api/superadmin/services/'),
    ])

    billingCycles.value = bcRes.data.results || bcRes.data || []
    services.value = svcRes.data.results || svcRes.data || []
  } catch (err) {
    console.error('Failed to fetch metadata:', err)
  }
}

const openAddDrawer = () => {
  isEdit.value = false
  form.value = {
    title: '',
    subtitle: '',
    description: '',
    target_type: 'ORGANIZATION',
    billing_cycle: 'MONTHLY',
    price: 0,
    features: [],
    is_active: true,
    capabilities: {},
  }
  drawerOpen.value = true
}

const openEditDrawer = async plan => {
  isEdit.value = true
  editId.value = plan.id
  
  const capsMap = {}
  try {
    const capRes = await superAdminApi.get('/api/superadmin/plan-capabilities/', {
      params: { plan: plan.id },
    })

    const caps = capRes.data.results || capRes.data || []

    caps.forEach(c => {
      const svcId = c.service?.id || c.service

      capsMap[svcId] = {
        enabled: true,
        id: c.id,
        permissions: c.permissions || { can_view: true, can_create: true, can_edit: true, can_delete: true },
      }
    })
  } catch (err) {
    console.error('Failed to fetch plan capabilities:', err)
  }

  form.value = {
    ...plan,
    capabilities: capsMap,
  }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    let planId = editId.value

    const planPayload = {
      title: form.value.title,
      subtitle: form.value.subtitle,
      description: form.value.description,
      target_type: form.value.target_type,
      billing_cycle: form.value.billing_cycle,
      price: form.value.price,
      features: form.value.features,
      is_active: form.value.is_active,
    }

    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/plans/${planId}/`, planPayload)
    } else {
      const res = await superAdminApi.post('/api/superadmin/plans/', planPayload)

      planId = res.data.id
    }

    // Sync Capabilities
    const capRes = await superAdminApi.get('/api/superadmin/plan-capabilities/', {
      params: { plan: planId },
    })

    const currentCaps = capRes.data.results || capRes.data || []
    const currentSvcIds = currentCaps.map(c => c.service?.id || c.service)

    for (const svc of services.value) {
      const capData = form.value.capabilities[svc.id]
      const exists = currentSvcIds.includes(svc.id)
      const currentCap = currentCaps.find(c => (c.service?.id || c.service) === svc.id)

      if (capData?.enabled) {
        const payload = {
          plan: planId,
          service: svc.id,
          permissions: capData.permissions,
        }

        if (exists) {
          await superAdminApi.put(`/api/superadmin/plan-capabilities/${currentCap.id}/`, payload)
        } else {
          await superAdminApi.post('/api/superadmin/plan-capabilities/', payload)
        }
      } else if (exists) {
        await superAdminApi.delete(`/api/superadmin/plan-capabilities/${currentCap.id}/`)
      }
    }

    drawerOpen.value = false
    fetchPlans()
  } catch (err) {
    console.error('Failed to save plan:', err)
  }
}

const toggleStatus = async plan => {
  try {
    await superAdminApi.patch(`/api/superadmin/plans/${plan.id}/`, {
      is_active: plan.is_active,
    })
  } catch (err) {
    console.error('Failed to toggle status:', err)
    plan.is_active = !plan.is_active
  }
}

onMounted(() => {
  fetchPlans()
  fetchMetadata()
})
</script>

<template>
  <div>
    <VRow v-if="loading">
      <VCol
        v-for="i in 3"
        :key="i"
        cols="12"
        sm="6"
        md="4"
      >
        <VSkeletonLoader type="card" />
      </VCol>
    </VRow>

    <VRow v-else-if="plans.length > 0">
      <VCol
        v-for="plan in plans"
        :key="plan.id"
        cols="12"
        sm="6"
        md="4"
      >
        <VCard class="plan-card h-100">
          <VCardText class="pa-6 d-flex flex-column h-100">
            <div class="d-flex justify-space-between align-start mb-4">
              <div>
                <VChip
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="mb-2 uppercase"
                >
                  {{ plan.target_type }}
                </VChip>
                <h3 class="text-h5 font-weight-bold">
                  {{ plan.title }}
                </h3>
                <div class="text-body-2 text-medium-emphasis">
                  {{ plan.subtitle }}
                </div>
              </div>
              <VBtn
                icon="tabler-edit"
                variant="text"
                size="small"
                color="medium-emphasis"
                @click="openEditDrawer(plan)"
              />
            </div>

            <div class="my-4">
              <span class="text-h4 font-weight-bold">₹{{ plan.price }}</span>
              <span class="text-body-2 text-medium-emphasis"> / {{ plan.billing_cycle }}</span>
            </div>

            <VDivider class="my-4" />

            <div class="flex-grow-1">
              <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                Features
              </div>
              <ul class="feature-list pa-0">
                <li
                  v-for="(feature, i) in plan.features"
                  :key="i"
                  class="d-flex align-center gap-2 mb-1"
                >
                  <VIcon
                    icon="tabler-check"
                    size="14"
                    color="success"
                  />
                  <span class="text-body-2">{{ feature }}</span>
                </li>
                <li
                  v-if="!plan.features || plan.features.length === 0"
                  class="text-body-2 text-medium-emphasis italic"
                >
                  No features listed.
                </li>
              </ul>
            </div>

            <div class="d-flex align-center justify-end mt-6">
              <VSwitch
                v-model="plan.is_active"
                density="compact"
                hide-details
                color="success"
                @update:model-value="toggleStatus(plan)"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard
      v-else
      class="builder-empty-state"
      variant="outlined"
    >
      <VCardText>
        <VIcon
          icon="tabler-package"
          size="48"
          color="medium-emphasis"
          class="mb-4"
        />
        <h3 class="text-h6 font-weight-bold mb-2">
          No Plans Created
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Create your first subscription plan to start selling services.
        </p>
        <VBtn
          variant="tonal"
          color="primary"
          @click="openAddDrawer"
        >
          Create First Plan
        </VBtn>
      </VCardText>
    </VCard>

    <div
      v-if="!hideNavigation"
      class="d-flex justify-space-between mt-8"
    >
      <VBtn
        variant="text"
        prepend-icon="tabler-arrow-left"
        @click="emit('prev')"
      >
        Back
      </VBtn>
      <VBtn
        color="success"
        append-icon="tabler-check"
        @click="router.push('/superadmin/dashboard')"
      >
        Finish Builder
      </VBtn>
    </div>

    <!-- Add/Edit Drawer -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="600"
      attach="body"
    >
      <div class="d-flex flex-column h-100">
        <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header">
          <h3 class="text-h6 font-weight-bold">
            {{ isEdit ? 'Edit Plan' : 'Create Plan' }}
          </h3>
          <VBtn
            icon="tabler-x"
            variant="text"
            @click="drawerOpen = false"
          />
        </div>

        <div class="flex-grow-1 overflow-y-auto pa-6">
          <VForm @submit.prevent="submit">
            <AppTextField
              v-model="form.title"
              label="Plan Title"
              placeholder="e.g. Gold Plan"
              class="mb-4"
              required
            />
            <AppTextField
              v-model="form.subtitle"
              label="Subtitle"
              placeholder="e.g. For growing clinics"
              class="mb-4"
            />
            
            <VRow>
              <VCol cols="6">
                <VSelect
                  v-model="form.target_type"
                  :items="targetTypes"
                  label="Target Audience"
                  class="mb-4"
                />
              </VCol>
              <VCol cols="6">
                <VSelect
                  v-model="form.billing_cycle"
                  :items="billingCycles"
                  label="Billing Cycle"
                  item-title="display_name"
                  item-value="code"
                  class="mb-4"
                />
              </VCol>
            </VRow>

            <AppTextField
              v-model.number="form.price"
              label="Price (₹)"
              type="number"
              placeholder="0.00"
              class="mb-4"
              required
            />

            <VDivider class="my-6" />

            <div class="text-subtitle-1 font-weight-bold mb-4">
              Included Services & Capabilities
            </div>
            <div class="d-flex flex-column gap-4 mb-6">
              <VCard
                v-for="svc in services"
                :key="svc.id"
                variant="outlined"
                class="pa-4"
              >
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center gap-2">
                    <VIcon
                      :icon="svc.icon || 'tabler-package'"
                      size="20"
                      color="primary"
                    />
                    <span class="font-weight-bold">{{ svc.display_name }}</span>
                  </div>
                  <VSwitch
                    v-model="form.capabilities[svc.id]"
                    :value="{ enabled: true, permissions: { can_view: true, can_create: true, can_edit: true, can_delete: true } }"
                    density="compact"
                    hide-details
                    color="primary"
                    @update:model-value="(val) => { 
                      if (val && !form.capabilities[svc.id]?.permissions) {
                        form.capabilities[svc.id] = { enabled: true, permissions: { can_view: true, can_create: true, can_edit: true, can_delete: true } }
                      }
                    }"
                  />
                </div>

                <VExpandTransition>
                  <div
                    v-if="form.capabilities[svc.id]?.enabled"
                    class="mt-4 pt-4 border-t"
                  >
                    <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                      Permissions
                    </div>
                    <div class="d-flex flex-wrap gap-x-6 gap-y-2">
                      <VCheckbox
                        v-model="form.capabilities[svc.id].permissions.can_view"
                        label="View"
                        density="compact"
                        hide-details
                      />
                      <VCheckbox
                        v-model="form.capabilities[svc.id].permissions.can_create"
                        label="Create"
                        density="compact"
                        hide-details
                      />
                      <VCheckbox
                        v-model="form.capabilities[svc.id].permissions.can_edit"
                        label="Edit"
                        density="compact"
                        hide-details
                      />
                      <VCheckbox
                        v-model="form.capabilities[svc.id].permissions.can_delete"
                        label="Delete"
                        density="compact"
                        hide-details
                      />
                    </div>
                  </div>
                </VExpandTransition>
              </VCard>
            </div>

            <VDivider class="my-6" />

            <div class="text-subtitle-1 font-weight-bold mb-4">
              Features (Marketing)
            </div>
            <div class="d-flex flex-wrap gap-2 mb-4">
              <VChip
                v-for="(feature, i) in form.features"
                :key="i"
                closable
                size="small"
                @click:close="form.features.splice(i, 1)"
              >
                {{ feature }}
              </VChip>
            </div>
            <AppTextField
              placeholder="Add a feature and press Enter"
              class="mb-8"
              @keyup.enter="(e) => { if(e.target.value) { form.features.push(e.target.value); e.target.value = '' } }"
            />

            <div class="d-flex gap-4">
              <VBtn
                color="primary"
                block
                type="submit"
              >
                {{ isEdit ? 'Update Plan' : 'Create Plan' }}
              </VBtn>
            </div>
          </VForm>
        </div>
      </div>
    </VNavigationDrawer>
  </div>
</template>

<style lang="scss" scoped>
.plan-card {
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }
}

.feature-list {
  list-style: none;
}

.border-dashed {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.uppercase {
  text-transform: uppercase;
}

.italic {
  font-style: italic;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.builder-empty-state {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
