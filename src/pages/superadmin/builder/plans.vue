<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { superAdminApi } from '@/plugins/axios'
import BillingCycleManager from './components/BillingCycleManager.vue'
import AppSelect from '@/@core/components/app-form-elements/AppSelect.vue'


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
const showBillingManager = ref(false)
const viewMode = ref('card')

const targetTypes = [
  { title: 'Organization', value: 'ORGANIZATION' },
  { title: 'Individual', value: 'INDIVIDUAL' },
]

const suggestedFeatures = [
  '24/7 Priority Support',
  'Mobile App Access',
  'Advanced Data Analytics',
  'Unlimited Staff Accounts',
  'Automated SMS Reminders',
  'Email Marketing Suite',
  'Smart Online Booking',
  'Integrated Payments',
  'Custom Clinic Branding',
  'Multi-Location Support',
]

const addFeature = feature => {
  if (!form.value.features.includes(feature)) {
    form.value.features.push(feature)
  }
}


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

const categories = ref([])
const facilities = ref([])
const rules = ref([])

const availableCapabilities = ref([])

const fetchMetadata = async () => {
  try {
    const [bcRes, svcRes, catRes, facRes, capRes, priceRes] = await Promise.all([
      superAdminApi.get('/api/superadmin/billing-cycles/'),
      superAdminApi.get('/api/superadmin/services/'),
      superAdminApi.get('/api/superadmin/categories/'),
      superAdminApi.get('/api/superadmin/facilities/'),
      superAdminApi.get('/api/superadmin/capabilities/'),
      superAdminApi.get(`/api/superadmin/pricing-rules/?limit=1000&_t=${Date.now()}`),
    ])

    billingCycles.value = bcRes.data.results || bcRes.data || []
    services.value = svcRes.data.results || svcRes.data || []
    categories.value = catRes.data.results || catRes.data || []
    facilities.value = facRes.data.results || facRes.data || []
    availableCapabilities.value = capRes.data.results || capRes.data || []
    rules.value = priceRes.data.results || priceRes.data || []
  } catch (err) {
    console.error('Failed to fetch metadata:', err)
  }
}

const getFacilityPrice = (facId) => {
    const rule = rules.value.find(r => {
        const rFacId = r.facility?.id || r.facility
        return String(rFacId) === String(facId)
    })
    if (!rule) return '0.00'
    return parseFloat(rule.base_price || 0).toFixed(2)
}

const getCategoryFacilities = (catId) => {
    return facilities.value.filter(f => {
        const fCatId = f.category?.id || f.category
        return String(fCatId) === String(catId)
    })
}

const groupedCapabilities = computed(() => {
  const groups = {}

  availableCapabilities.value.forEach(cap => {
    if (!groups[cap.group]) {
      groups[cap.group] = []
    }
    groups[cap.group].push(cap)
  })
  
  return groups
})

const customerServices = computed(() => {
  return services.value.filter(s => {
    const isNotVet = s.name?.toUpperCase() !== 'VETERINARY'
    const matchesTarget = !s.target_audience || s.target_audience === 'BOTH' || s.target_audience === form.value.target_type
    
    return isNotVet && matchesTarget
  })
})

const veterinaryService = computed(() => {
  return services.value.find(s => {
    const isVet = s.name?.toUpperCase() === 'VETERINARY'
    const matchesTarget = !s.target_audience || s.target_audience === 'BOTH' || s.target_audience === form.value.target_type
    
    return isVet && matchesTarget
  })
})

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
    
    // Initialize map structure
    // Key: serviceId (for service cap), serviceId:categoryId (for category cap), serviceId:facilityId (for facility cap)
    // Actually, let's use a nested structure or composite keys.
    // Let's use composite keys for simplicity in v-model:
    // Service: "svc_ID"
    // Category: "cat_ID"
    // Facility: "fac_ID"
    
    caps.forEach(c => {
      const svcId = c.service?.id || c.service
      const catId = c.category?.id || c.category
      const facId = c.facility?.id || c.facility
      
      let key = ''
      if (facId) key = `fac_${facId}`
      else if (catId) key = `cat_${catId}`
      else if (svcId) key = `svc_${svcId}`
      
      if (key) {
        // BUG FIX: If permissions is an empty object, default to full access
        const basePermissions = c.permissions && Object.keys(c.permissions).length > 0 
          ? c.permissions 
          : { can_view: true, can_create: true, can_edit: true, can_delete: true }

        capsMap[key] = {
          enabled: true,
          id: c.id,
          permissions: basePermissions,
        }
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

    // Auto-sync Categories for Veterinary permissions
    const vetSvc = veterinaryService.value
    if (vetSvc) {
      const vetCap = form.value.capabilities[`svc_${vetSvc.id}`]
      if (vetCap && vetCap.enabled && vetCap.permissions) {
        Object.keys(vetCap.permissions).forEach(permKey => {
          if (vetCap.permissions[permKey]) {
            // Find category linked to this permKey
            const cat = categories.value.find(c => c.linked_capability === permKey)
            if (cat) {
              const catKey = `cat_${cat.id}`
              if (!form.value.capabilities[catKey] || !form.value.capabilities[catKey].enabled) {
                form.value.capabilities[catKey] = {
                  enabled: true,
                  permissions: { can_view: true, can_create: true, can_edit: true, can_delete: true },
                }
              }
            }
          }
        })
      }
    }

    // Sync Capabilities
    const capRes = await superAdminApi.get('/api/superadmin/plan-capabilities/', {
      params: { plan: planId },
    })

    const currentCaps = capRes.data.results || capRes.data || []
    
    // Helper to find existing capability
    const findCap = (svcId, catId, facId) => {
      return currentCaps.find(c => {
        const cSvcId = c.service?.id || c.service
        const cCatId = c.category?.id || c.category
        const cFacId = c.facility?.id || c.facility
        
        // Match logic:
        // If looking for service cap: catId and facId must be null
        // If looking for category cap: svcId matches, catId matches, facId null
        // If looking for facility cap: svcId matches, facId matches (catId might be null or not depending on facility)
        
        if (facId) return cFacId === facId
        if (catId) return cCatId === catId && !cFacId
        if (svcId) return cSvcId === svcId && !cCatId && !cFacId
        
        return false
      })
    }

    // Process all keys in form.capabilities
    for (const key in form.value.capabilities) {
      const capData = form.value.capabilities[key]
      if (!capData) continue

      let svcId = null
      let catId = null
      let facId = null

      if (key.startsWith('svc_')) {
        svcId = key.split('_')[1]
      }
      else if (key.startsWith('cat_')) {
        catId = key.split('_')[1]

        // Find service for this category
        const cat = categories.value.find(c => String(c.id) === String(catId))
        if (cat) svcId = cat.service
      }
      else if (key.startsWith('fac_')) {
        facId = key.split('_')[1]

        // Find service/category for this facility
        const fac = facilities.value.find(f => String(f.id) === String(facId))
        if (fac) {
            // Priority: Service > Category > Service via Category
            if (fac.service) { // Direct service link
                svcId = fac.service
            } 
            
            // Check Category regardless
            const fCatId = fac.category?.id || fac.category
            if (fCatId) {
                catId = fCatId // Send category_id too?
                const cat = categories.value.find(c => String(c.id) === String(fCatId))
                if (cat) {
                    svcId = cat.service // Derive service from category if not already set
                }
            }
        }
      }

      const existingCap = findCap(svcId, catId, facId)

      if (capData.enabled) {
        // Backend requires service_id or category_id
        // If simply facility_id provided, backend rejects.
        if (!svcId && !catId && facId) {
             console.warn('Skipping facility capability save due to missing context:', facId)
             continue
        }

        const payload = {
          plan_id: planId,
          service_id: svcId || null,
          category_id: catId || null, // Include category context if available
          facility_id: facId || null,
          permissions: capData.permissions,
        }
        
        if (existingCap) {
          await superAdminApi.put(`/api/superadmin/plan-capabilities/${existingCap.id}/`, payload)
        } else {
          await superAdminApi.post('/api/superadmin/plan-capabilities/', payload)
        }
      } else if (existingCap) {
        // If disabled but exists, delete it
        await superAdminApi.delete(`/api/superadmin/plan-capabilities/${existingCap.id}/`)
      }
    }
    
    // Cleanup
    for (const cap of currentCaps) {
      const cSvcId = cap.service?.id || cap.service
      const cCatId = cap.category?.id || cap.category
      const cFacId = cap.facility?.id || cap.facility
      
      let key = ''
      if (cFacId) key = `fac_${cFacId}`
      else if (cCatId) key = `cat_${cCatId}`
      else if (cSvcId) key = `svc_${cSvcId}`
      
      if (key && (!form.value.capabilities[key] || !form.value.capabilities[key].enabled)) {
        await superAdminApi.delete(`/api/superadmin/plan-capabilities/${cap.id}/`)
      }
    }

    drawerOpen.value = false
    fetchPlans()
  } catch (err) {
    console.error('Failed to save plan:', err)
  }
}

const toggleCapability = (type, id, val) => {
  const key = `${type}_${id}`
  if (val) {
    // Enable
    if (!form.value.capabilities[key]) {
      form.value.capabilities[key] = {
        enabled: true,
        permissions: { can_view: true, can_create: true, can_edit: true, can_delete: true }, 
      }
    } else {
      form.value.capabilities[key].enabled = true

      // If it exists but has no permissions, ensure they are set
      if (!form.value.capabilities[key].permissions || Object.keys(form.value.capabilities[key].permissions).length === 0) {
        form.value.capabilities[key].permissions = { can_view: true, can_create: true, can_edit: true, can_delete: true }
      }
    }

    // ✅ AUTO-SELECT CATEGORIES Logic
    if (type === 'svc') {
      const serviceCategories = categories.value.filter(c => c.service === id)
      serviceCategories.forEach(cat => {
        // Recursively enable category
        toggleCapability('cat', cat.id, true)
      })
    }

  } else {
    // Disable
    if (form.value.capabilities[key]) {
      form.value.capabilities[key].enabled = false
    }

    // ✅ AUTO-DESELECT CATEGORIES Logic
    if (type === 'svc') {
      const serviceCategories = categories.value.filter(c => c.service === id)
      serviceCategories.forEach(cat => {
        toggleCapability('cat', cat.id, false)
      })
    }
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

const deleteDialog = ref(false)
const planToDelete = ref(null)

const confirmDelete = plan => {
  planToDelete.value = plan
  deleteDialog.value = true
}

const deletePlan = async () => {
  if (!planToDelete.value) return
  
  try {
    await superAdminApi.delete(`/api/superadmin/plans/${planToDelete.value.id}/`)
    deleteDialog.value = false
    planToDelete.value = null
    fetchPlans()
  } catch (err) {
    console.error('Failed to delete plan:', err)
  }
}

const groupCapabilities = caps => {
  if (!caps || !caps.length) return []
  
  const grouped = {}
  
  caps.forEach(cap => {
    const svc = cap.service
    if (!svc) return

    if (!grouped[svc.id]) {
      grouped[svc.id] = {
        service: svc,
        permissions: null, // Service-level permissions
        categories: {},
        facilities: {},
        vetCapabilities: [], // For veterinary human-friendly labels
      }
    }

    if (cap.category) {
      // Category capability
      grouped[svc.id].categories[cap.category.id] = {
        category: cap.category,
        permissions: cap.permissions,
      }
    } else if (cap.facility) {
      // Facility capability
      grouped[svc.id].facilities[cap.facility.id] = {
        facility: cap.facility,
        permissions: cap.permissions,
      }
    } else {
      // Service capability
      grouped[svc.id].permissions = cap.permissions
      
      // If it's veterinary, extract human-friendly labels
      if (svc.name?.toUpperCase() === 'VETERINARY' && cap.permissions) {
        Object.keys(cap.permissions).forEach(key => {
          if (cap.permissions[key]) {
            const capInfo = availableCapabilities.value.find(c => c.key === key)
            if (capInfo) {
              grouped[svc.id].vetCapabilities.push(capInfo.label)
            }
          }
        })
      }
    }
  })

  return Object.values(grouped).map(g => ({
    ...g,
    categories: Object.values(g.categories),
    facilities: Object.values(g.facilities),
  }))
}

onMounted(() => {
  fetchPlans()
  fetchMetadata()
})
</script>

<template>
  <div class="builder-container">
    <div class="d-flex justify-space-between align-center mb-6 flex-shrink-0">
      <VBtnToggle
        v-model="viewMode"
        mandatory
        density="compact"
        color="primary"
        variant="outlined"
        class="bg-surface premium-toggle"
      >
        <VBtn
          value="card"
          prepend-icon="tabler-layout-grid"
        >
          Grid
        </VBtn>
        <VBtn
          value="table"
          prepend-icon="tabler-table"
        >
          Table
        </VBtn>
      </VBtnToggle>

      <div class="d-flex gap-3">
        <VBtn
          variant="text"
          prepend-icon="tabler-settings"
          class="premium-btn-text"
          @click="showBillingManager = true"
        >
          Manage Billing Cycles
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          class="premium-btn shadow-sm"
          @click="openAddDrawer"
        >
          Create Plan
        </VBtn>
      </div>
    </div>

    <VDialog
      v-model="showBillingManager"
      max-width="800"
    >
      <BillingCycleManager @refresh="fetchMetadata" />
    </VDialog>

    <VDialog
      v-model="deleteDialog"
      max-width="500"
    >
      <VCard title="Delete Plan">
        <VCardText>
          Are you sure you want to delete this plan? This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="medium-emphasis"
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            @click="deletePlan"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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

    <div v-if="viewMode === 'card'">
      <VRow v-if="plans.length > 0">
        <VCol
          v-for="plan in plans"
          :key="plan.id"
          cols="12"
          sm="6"
          md="4"
        >
          <VCard class="plan-card premium-card h-100">
            <div class="card-glass-overlay" />
            <VCardText class="pa-6 d-flex flex-column h-100 position-relative">
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
                <div class="d-flex">
                  <VBtn
                    icon="tabler-edit"
                    variant="text"
                    size="small"
                    color="medium-emphasis"
                    @click="openEditDrawer(plan)"
                  />
                  <VBtn
                    icon="tabler-trash"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDelete(plan)"
                  />
                </div>
              </div>

              <div class="my-6">
                <div class="d-flex align-baseline gap-1">
                  <span class="text-h3 font-weight-bold text-primary">₹{{ plan.price }}</span>
                  <span class="text-body-1 text-medium-emphasis">/ {{ plan.billing_cycle }}</span>
                </div>
              </div>

              <VDivider class="my-6 opacity-50" />

              <div class="flex-grow-1">
                <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                  Features
                </div>
                <ul class="feature-list pa-0 mb-4">
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

                <div v-if="plan.capabilities && plan.capabilities.length > 0">
                  <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                    Capabilities
                  </div>
                  <VExpansionPanels
                    variant="accordion"
                    density="compact"
                    class="mb-4"
                  >
                    <VExpansionPanel
                      v-for="group in groupCapabilities(plan.capabilities)"
                      :key="group.service.id"
                      elevation="0"
                      class="border rounded mb-1"
                    >
                      <VExpansionPanelTitle class="pa-2 min-h-0">
                        <div class="d-flex align-center gap-2">
                          <VIcon
                            :icon="group.service.icon || 'tabler-package'"
                            size="16"
                            color="primary"
                          />
                          <span class="text-body-2 font-weight-medium">{{ group.service.display_name }}</span>
                        </div>
                      </VExpansionPanelTitle>
                      <VExpansionPanelText class="pa-0">
                        <div class="pa-2">
                          <!-- Veterinary Labels -->
                          <div
                            v-if="group.service.name?.toUpperCase() === 'VETERINARY' && group.vetCapabilities.length > 0"
                            class="d-flex gap-2 mb-2 flex-wrap"
                          >
                            <VChip
                              v-for="label in group.vetCapabilities"
                              :key="label"
                              size="x-small"
                              color="success"
                              variant="flat"
                            >
                              {{ label }}
                            </VChip>
                          </div>

                          <!-- Service Permissions (Non-Veterinary) -->
                          <div
                            v-else-if="group.permissions"
                            class="d-flex gap-2 mb-2 flex-wrap"
                          >
                            <VChip
                              v-if="group.permissions.can_view"
                              size="x-small"
                              color="info"
                              variant="flat"
                            >
                              View
                            </VChip>
                            <VChip
                              v-if="group.permissions.can_create"
                              size="x-small"
                              color="success"
                              variant="flat"
                            >
                              Create
                            </VChip>
                            <VChip
                              v-if="group.permissions.can_edit"
                              size="x-small"
                              color="warning"
                              variant="flat"
                            >
                              Edit
                            </VChip>
                            <VChip
                              v-if="group.permissions.can_delete"
                              size="x-small"
                              color="error"
                              variant="flat"
                            >
                              Delete
                            </VChip>
                          </div>

                          <!-- Categories -->
                          <div
                            v-if="group.categories.length > 0"
                            class="mb-2"
                          >
                            <div class="text-caption font-weight-bold mb-1">
                              Categories
                            </div>
                            <div
                              v-for="cat in group.categories"
                              :key="cat.category.id"
                              class="d-flex align-center justify-space-between mb-1 pl-2 border-l-2"
                            >
                              <span class="text-caption">{{ cat.category.name }}</span>
                              <div class="d-flex gap-1">
                                <VIcon
                                  v-if="cat.permissions.can_view"
                                  icon="tabler-eye"
                                  size="12"
                                  color="medium-emphasis"
                                  title="View"
                                />
                                <VIcon
                                  v-if="cat.permissions.can_create"
                                  icon="tabler-plus"
                                  size="12"
                                  color="medium-emphasis"
                                  title="Create"
                                />
                                <VIcon
                                  v-if="cat.permissions.can_edit"
                                  icon="tabler-pencil"
                                  size="12"
                                  color="medium-emphasis"
                                  title="Edit"
                                />
                                <VIcon
                                  v-if="cat.permissions.can_delete"
                                  icon="tabler-trash"
                                  size="12"
                                  color="medium-emphasis"
                                  title="Delete"
                                />
                              </div>
                            </div>
                          </div>

                          <!-- Facilities -->
                          <div v-if="group.facilities.length > 0">
                            <div class="text-caption font-weight-bold mb-1">
                              Facilities
                            </div>
                            <div
                              v-for="fac in group.facilities"
                              :key="fac.facility.id"
                              class="d-flex align-center justify-space-between mb-1 pl-2 border-l-2"
                            >
                              <span class="text-caption">{{ fac.facility.name }}</span>
                              <div class="d-flex gap-1">
                                <VIcon
                                  v-if="fac.permissions.can_view"
                                  icon="tabler-eye"
                                  size="12"
                                  color="medium-emphasis"
                                  title="View"
                                />
                                <VIcon
                                  v-if="fac.permissions.can_create"
                                  icon="tabler-plus"
                                  size="12"
                                  color="medium-emphasis"
                                  title="Create"
                                />
                                <VIcon
                                  v-if="fac.permissions.can_edit"
                                  icon="tabler-pencil"
                                  size="12"
                                  color="medium-emphasis"
                                  title="Edit"
                                />
                                <VIcon
                                  v-if="fac.permissions.can_delete"
                                  icon="tabler-trash"
                                  size="12"
                                  color="medium-emphasis"
                                  title="Delete"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </VExpansionPanelText>
                    </VExpansionPanel>
                  </VExpansionPanels>
                </div>
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
        class="builder-empty-state premium-empty-state"
        variant="outlined"
      >
        <VCardText class="pa-12">
          <div class="empty-state-icon-wrapper mb-6">
            <VIcon
              icon="tabler-package"
              size="64"
              color="primary"
            />
          </div>
          <h3 class="text-h4 font-weight-bold mb-3">
            No Plans Created
          </h3>
          <p
            class="text-body-1 text-medium-emphasis mb-8 mx-auto"
            style="max-width: 400px;"
          >
            Start your journey by creating your first subscription plan. Define services, pricing, and capabilities to empower your providers.
          </p>
          <VBtn 
            variant="elevated" 
            color="primary" 
            size="large"
            prepend-icon="tabler-plus"
            class="premium-btn"
            @click="openAddDrawer"
          >
            Create First Plan
          </VBtn>
        </VCardText>
      </VCard>
    </div>

    <div v-else>
      <VCard variant="outlined">
        <VDataTable
          :headers="[
            { title: 'Title', key: 'title' },
            { title: 'Target', key: 'target_type' },
            { title: 'Price', key: 'price' },
            { title: 'Billing Cycle', key: 'billing_cycle' },
            { title: 'Status', key: 'is_active' },
            { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
          ]"
          :items="plans"
          :loading="loading"
          hover
          show-expand
          expand-on-click
        >
          <template #expanded-row="{ columns, item }">
            <tr>
              <td
                :colspan="columns.length"
                class="pa-4 bg-background"
              >
                <div class="d-flex gap-4">
                  <!-- Features -->
                  <div style="min-width: 200px;">
                    <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                      Features
                    </div>
                    <ul class="feature-list pa-0">
                      <li
                        v-for="(feature, i) in item.features"
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
                        v-if="!item.features || item.features.length === 0"
                        class="text-body-2 text-medium-emphasis italic"
                      >
                        No features listed.
                      </li>
                    </ul>
                  </div>

                  <!-- Capabilities -->
                  <div class="flex-grow-1">
                    <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                      Capabilities
                    </div>
                    <div class="d-flex flex-wrap gap-4">
                      <VCard
                        v-for="group in groupCapabilities(item.capabilities)"
                        :key="group.service.id"
                        variant="outlined"
                        class="pa-3"
                        style="min-width: 250px;"
                      >
                        <div class="d-flex align-center gap-2 mb-2">
                          <VIcon
                            :icon="group.service.icon || 'tabler-package'"
                            size="18"
                            color="primary"
                          />
                          <span class="text-body-2 font-weight-bold">{{ group.service.display_name }}</span>
                        </div>

                        <!-- Veterinary Labels -->
                        <div
                          v-if="group.service.name?.toUpperCase() === 'VETERINARY' && group.vetCapabilities.length > 0"
                          class="d-flex gap-1 mb-2 flex-wrap"
                        >
                          <VChip
                            v-for="label in group.vetCapabilities"
                            :key="label"
                            size="x-small"
                            color="success"
                            variant="flat"
                          >
                            {{ label }}
                          </VChip>
                        </div>

                        <!-- Service Permissions (Non-Veterinary) -->
                        <div
                          v-else-if="group.permissions"
                          class="d-flex gap-1 mb-2"
                        >
                          <VIcon
                            v-if="group.permissions.can_view"
                            icon="tabler-eye"
                            size="14"
                            color="medium-emphasis"
                            title="View"
                          />
                          <VIcon
                            v-if="group.permissions.can_create"
                            icon="tabler-plus"
                            size="14"
                            color="medium-emphasis"
                            title="Create"
                          />
                          <VIcon
                            v-if="group.permissions.can_edit"
                            icon="tabler-pencil"
                            size="14"
                            color="medium-emphasis"
                            title="Edit"
                          />
                          <VIcon
                            v-if="group.permissions.can_delete"
                            icon="tabler-trash"
                            size="14"
                            color="medium-emphasis"
                            title="Delete"
                          />
                        </div>

                        <!-- Categories -->
                        <div
                          v-if="group.categories.length > 0"
                          class="mb-2"
                        >
                          <div class="text-caption font-weight-bold mb-1">
                            Categories
                          </div>
                          <div
                            v-for="cat in group.categories"
                            :key="cat.category.id"
                            class="d-flex align-center justify-space-between mb-1 pl-2 border-l-2"
                          >
                            <span class="text-caption">{{ cat.category.name }}</span>
                            <div class="d-flex gap-1">
                              <VIcon
                                v-if="cat.permissions.can_view"
                                icon="tabler-eye"
                                size="12"
                                color="medium-emphasis"
                              />
                              <VIcon
                                v-if="cat.permissions.can_create"
                                icon="tabler-plus"
                                size="12"
                                color="medium-emphasis"
                              />
                              <VIcon
                                v-if="cat.permissions.can_edit"
                                icon="tabler-pencil"
                                size="12"
                                color="medium-emphasis"
                              />
                              <VIcon
                                v-if="cat.permissions.can_delete"
                                icon="tabler-trash"
                                size="12"
                                color="medium-emphasis"
                              />
                            </div>
                          </div>
                        </div>

                        <!-- Facilities -->
                        <div v-if="group.facilities.length > 0">
                          <div class="text-caption font-weight-bold mb-1">
                            Facilities
                          </div>
                          <div
                            v-for="fac in group.facilities"
                            :key="fac.facility.id"
                            class="d-flex align-center justify-space-between mb-1 pl-2 border-l-2"
                          >
                            <span class="text-caption">{{ fac.facility.name }}</span>
                            <div class="d-flex gap-1">
                              <VIcon
                                v-if="fac.permissions.can_view"
                                icon="tabler-eye"
                                size="12"
                                color="medium-emphasis"
                              />
                              <VIcon
                                v-if="fac.permissions.can_create"
                                icon="tabler-plus"
                                size="12"
                                color="medium-emphasis"
                              />
                              <VIcon
                                v-if="fac.permissions.can_edit"
                                icon="tabler-pencil"
                                size="12"
                                color="medium-emphasis"
                              />
                              <VIcon
                                v-if="fac.permissions.can_delete"
                                icon="tabler-trash"
                                size="12"
                                color="medium-emphasis"
                              />
                            </div>
                          </div>
                        </div>
                      </VCard>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <template #item.title="{ item }">
            <div>
              <div class="font-weight-bold">
                {{ item.title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.subtitle }}
              </div>
            </div>
          </template>

          <template #item.target_type="{ item }">
            <VChip
              size="small"
              color="info"
              variant="tonal"
              class="uppercase"
            >
              {{ item.target_type }}
            </VChip>
          </template>

          <template #item.price="{ item }">
            <span class="font-weight-bold">₹{{ item.price }}</span>
          </template>

          <template #item.is_active="{ item }">
            <VSwitch
              v-model="item.is_active"
              density="compact"
              hide-details
              color="success"
              @update:model-value="toggleStatus(item)"
            />
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-end">
              <VBtn
                icon="tabler-edit"
                variant="text"
                size="small"
                color="medium-emphasis"
                @click="openEditDrawer(item)"
              />
              <VBtn
                icon="tabler-trash"
                variant="text"
                size="small"
                color="error"
                @click="confirmDelete(item)"
              />
            </div>
          </template>
        </VDataTable>
      </VCard>
    </div>



    <div
      v-if="!hideNavigation"
      class="d-flex justify-space-between mt-8 flex-shrink-0"
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
    <Teleport to="body">
      <VNavigationDrawer
        v-model="drawerOpen"
        location="end"
        temporary
        :scrim="false"
        width="500"
        class="builder-drawer premium-drawer"
        style="z-index: 8888 !important; top: 0 !important; height: 100vh !important; position: fixed !important;"
      >
        <div class="d-flex flex-column h-100 glass-drawer-content">
          <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header glass-header">
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
            <VForm
              id="planForm"
              @submit.prevent="submit"
            >
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
                  <AppSelect
                    v-model="form.target_type"
                    :items="targetTypes"
                    label="Target Audience"
                    class="mb-4"
                    attach="body"
                    :menu-props="{
                      attach: 'body',
                      zIndex: 10000,
                      offsetY: true
                    }"
                  />
                </VCol>
                <VCol cols="6">
                  <AppSelect
                    v-model="form.billing_cycle"
                    :items="billingCycles"
                    label="Billing Cycle"
                    item-title="display_name"
                    item-value="code"
                    class="mb-4"
                    attach="body"
                    :menu-props="{
                      attach: 'body',
                      zIndex: 10000,
                      offsetY: true
                    }"
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
                <!-- Customer Services Section -->
                <div
                  v-if="customerServices.length > 0"
                  class="mb-6"
                >
                  <div class="text-overline font-weight-bold text-primary mb-4 d-flex align-center gap-2">
                    <VIcon
                      icon="tabler-shopping-cart"
                      size="18"
                    />
                    Customer Services (Revenue)
                  </div>
                  <div class="d-flex flex-column gap-4">
                    <VCard
                      v-for="svc in customerServices"
                      :key="svc.id"
                      variant="outlined"
                      class="pa-4"
                    >
                      <!-- Service Level -->
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
                          :model-value="!!form.capabilities[`svc_${svc.id}`]?.enabled"
                          density="compact"
                          hide-details
                          color="primary"
                          @update:model-value="(val) => toggleCapability('svc', svc.id, val)"
                        />
                      </div>

                      <VExpandTransition>
                        <div
                          v-if="form.capabilities[`svc_${svc.id}`]?.enabled"
                          class="mt-4 pt-4 border-t"
                        >
                          <!-- Categories -->
                          <div
                            v-if="categories.filter(c => c.service === svc.id).length > 0"
                            class="pl-4 border-l-2"
                          >
                            <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                              Categories
                            </div>
                            <div
                              v-for="cat in categories.filter(c => c.service === svc.id)"
                              :key="cat.id"
                              class="mb-4"
                            >
                              <div class="d-flex align-center justify-space-between mb-2">
                                <span class="text-body-2 font-weight-medium">{{ cat.name }}</span>
                                <VSwitch
                                  :model-value="!!form.capabilities[`cat_${cat.id}`]?.enabled"
                                  density="compact"
                                  hide-details
                                  color="info"
                                  @update:model-value="(val) => toggleCapability('cat', cat.id, val)"
                                />
                              </div>

                              <!-- Category Permissions -->
                              <VExpandTransition>
                                <div v-if="form.capabilities[`cat_${cat.id}`]?.enabled">
                                  <div class="d-flex flex-wrap gap-x-6 gap-y-2 mb-3">
                                    <VCheckbox
                                      v-model="form.capabilities[`cat_${cat.id}`].permissions.can_view"
                                      label="View"
                                      density="compact"
                                      hide-details
                                    />
                                    <VCheckbox
                                      v-model="form.capabilities[`cat_${cat.id}`].permissions.can_create"
                                      label="Create"
                                      density="compact"
                                      hide-details
                                    />
                                    <VCheckbox
                                      v-model="form.capabilities[`cat_${cat.id}`].permissions.can_edit"
                                      label="Edit"
                                      density="compact"
                                      hide-details
                                    />
                                    <VCheckbox
                                      v-model="form.capabilities[`cat_${cat.id}`].permissions.can_delete"
                                      label="Delete"
                                      density="compact"
                                      hide-details
                                    />
                                  </div>
                                </div>
                              </VExpandTransition>

                              <!-- Facilities (Nested in Category) -->
                              <div
                                v-if="getCategoryFacilities(cat.id).length > 0"
                                class="mt-3 ml-1"
                              >
                                <div class="text-caption font-weight-bold opacity-60 mb-2 text-uppercase spacing-1">
                                  Facilities
                                </div>
                                <div class="d-flex flex-column gap-2 border rounded-lg pa-3 bg-grey-lighten-5">
                                  <div
                                    v-for="fac in getCategoryFacilities(cat.id)"
                                    :key="fac.id"
                                    class="d-flex flex-column"
                                  >
                                    <div class="d-flex align-center justify-space-between">
                                      <div class="d-flex align-center gap-2">
                                          <VIcon icon="tabler-tool" size="14" class="text-medium-emphasis" />
                                          <span class="text-body-2 font-weight-medium">{{ fac.name }}</span>
                                          <VChip size="x-small" variant="tonal" color="secondary" class="ml-1">
                                            ₹{{ getFacilityPrice(fac.id) }}
                                          </VChip>
                                      </div>
                                      <VSwitch
                                        :model-value="!!form.capabilities[`fac_${fac.id}`]?.enabled"
                                        density="compact"
                                        hide-details
                                        color="warning"
                                        label="Enable"
                                        class="ml-4"
                                        @update:model-value="(val) => toggleCapability('fac', fac.id, val)"
                                      />
                                    </div>

                                    <VExpandTransition>
                                      <div v-if="form.capabilities[`fac_${fac.id}`]?.enabled" class="pl-6 mt-1 border-s pb-1">
                                        <div class="d-flex flex-wrap gap-x-4 gap-y-1">
                                          <VCheckbox
                                            v-model="form.capabilities[`fac_${fac.id}`].permissions.can_view"
                                            label="View"
                                            density="compact"
                                            hide-details
                                          />
                                          <VCheckbox
                                            v-model="form.capabilities[`fac_${fac.id}`].permissions.can_create"
                                            label="Create"
                                            density="compact"
                                            hide-details
                                          />
                                          <VCheckbox
                                            v-model="form.capabilities[`fac_${fac.id}`].permissions.can_edit"
                                            label="Edit"
                                            density="compact"
                                            hide-details
                                          />
                                          <VCheckbox
                                            v-model="form.capabilities[`fac_${fac.id}`].permissions.can_delete"
                                            label="Delete"
                                            density="compact"
                                            hide-details
                                          />
                                        </div>
                                      </div>
                                    </VExpandTransition>
                                    
                                    <!-- Divider between items unless last -->
                                    <VDivider 
                                      v-if="fac.id !== getCategoryFacilities(cat.id)[getCategoryFacilities(cat.id).length - 1].id" 
                                      class="my-2 border-dashed" 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Facilities (Directly under Service) -->

                        </div>
                      </VExpandTransition>
                    </VCard>
                  </div>
                </div>

                <!-- Veterinary Operations Section -->
                <div
                  v-if="veterinaryService"
                  class="mb-6"
                >
                  <div class="text-overline font-weight-bold text-success mb-4 d-flex align-center gap-2">
                    <VIcon
                      icon="tabler-settings-automation"
                      size="18"
                    />
                    Veterinary Operations Access
                  </div>
                  <VCard
                    variant="outlined"
                    class="pa-4"
                  >
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="d-flex align-center gap-2">
                        <VIcon
                          :icon="veterinaryService.icon || 'tabler-stethoscope'"
                          size="20"
                          color="success"
                        />
                        <span class="font-weight-bold">Veterinary Operations</span>
                      </div>
                      <VSwitch
                        :model-value="!!form.capabilities[`svc_${veterinaryService.id}`]?.enabled"
                        density="compact"
                        hide-details
                        color="success"
                        @update:model-value="(val) => toggleCapability('svc', veterinaryService.id, val)"
                      />
                    </div>

                    <VExpandTransition>
                      <div
                        v-if="form.capabilities[`svc_${veterinaryService.id}`]?.enabled"
                        class="mt-4 pt-4 border-t"
                      >
                         <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2 pl-4">
                           Core Categories
                         </div>

                        <!-- Categories List (Veterinary) -->
                        <div
                          v-for="cat in categories.filter(c => c.service === veterinaryService.id)"
                          :key="cat.id"
                          class="mb-4 pl-4 border-l-2 ml-2"
                        >
                          <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-body-2 font-weight-medium">{{ cat.name }}</span>
                            <VSwitch
                              :model-value="!!form.capabilities[`cat_${cat.id}`]?.enabled"
                              density="compact"
                              hide-details
                              color="success"
                              @update:model-value="(val) => toggleCapability('cat', cat.id, val)"
                            />
                          </div>
              
                          <!-- Category Permissions -->
                          <VExpandTransition>
                            <div v-if="form.capabilities[`cat_${cat.id}`]?.enabled">
                              <div class="d-flex flex-wrap gap-x-6 gap-y-2 mb-3">
                                <VCheckbox
                                  v-model="form.capabilities[`cat_${cat.id}`].permissions.can_view"
                                  label="View"
                                  density="compact"
                                  hide-details
                                />
                                <VCheckbox
                                  v-model="form.capabilities[`cat_${cat.id}`].permissions.can_create"
                                  label="Create"
                                  density="compact"
                                  hide-details
                                />
                                <VCheckbox
                                  v-model="form.capabilities[`cat_${cat.id}`].permissions.can_edit"
                                  label="Edit"
                                  density="compact"
                                  hide-details
                                />
                                <VCheckbox
                                  v-model="form.capabilities[`cat_${cat.id}`].permissions.can_delete"
                                  label="Delete"
                                  density="compact"
                                  hide-details
                                />
                              </div>
                            </div>
                          </VExpandTransition>
                        </div>

                      </div>
                    </VExpandTransition>
                  </VCard>
                </div>
              </div>

              <VDivider class="my-6" />

              <div class="text-subtitle-1 font-weight-bold mb-2">
                Features (Marketing)
              </div>
            
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-2">
                  Suggestions (Click to add)
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <VChip
                    v-for="suggested in suggestedFeatures.filter(f => !form.features.includes(f))"
                    :key="suggested"
                    size="small"
                    variant="outlined"
                    color="secondary"
                    class="cursor-pointer"
                    @click="addFeature(suggested)"
                  >
                    <VIcon
                      icon="tabler-plus"
                      size="14"
                      start
                    />
                    {{ suggested }}
                  </VChip>
                  <div
                    v-if="suggestedFeatures.every(f => form.features.includes(f))"
                    class="text-caption italic text-medium-emphasis"
                  >
                    All suggestions added.
                  </div>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 mb-4">
                <VChip
                  v-for="(feature, i) in form.features"
                  :key="i"
                  closable
                  size="small"
                  color="primary"
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
            </VForm>
          </div>

          <div class="pa-6 border-t bg-surface">
            <div class="d-flex gap-4">
              <VBtn
                color="primary"
                block
                type="submit"
                form="planForm"
              >
                {{ isEdit ? 'Update Plan' : 'Create Plan' }}
              </VBtn>
            </div>
          </div>
        </div>
      </VNavigationDrawer>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.plan-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.12) !important;
  background: rgb(var(--v-theme-surface)) !important;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;
    border-color: rgba(var(--v-theme-primary), 0.24) !important;

    .card-glass-overlay {
      opacity: 1;
    }
  }
}

.premium-card {
  border-radius: 20px !important;
  
  .card-glass-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
}

.feature-list {
  list-style: none;
  
  li {
    transition: transform 0.2s ease;
    &:hover {
      transform: translateX(4px);
    }
  }
}

.builder-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(180deg, rgba(var(--v-theme-background), 0.5) 0%, rgb(var(--v-theme-background)) 100%);
}

.premium-drawer {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(20px) saturate(180%);
  border-left: 1px solid rgba(var(--v-border-color), 0.12) !important;

  .glass-drawer-content {
    background: transparent !important;
  }

  .glass-header {
    background: rgba(var(--v-theme-surface), 0.4) !important;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
  }

  .sticky-header {
    z-index: 10;
  }
}

.uppercase {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.italic {
  font-style: italic;
}

.builder-empty-state {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 24px !important;
  border: 2px dashed rgba(var(--v-border-color), 0.2) !important;
  background: rgba(var(--v-theme-surface), 0.4) !important;
  backdrop-filter: blur(10px);
  
  .empty-state-icon-wrapper {
    display: inline-flex;
    padding: 24px;
    border-radius: 24px;
    background: rgba(var(--v-theme-primary), 0.08);
    color: rgb(var(--v-theme-primary));
    animation: float 3s ease-in-out infinite;
  }
}

.premium-btn {
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &:hover {
    transform: scale(1.02) translateY(-2px);
    box-shadow: 0 8px 16px rgba(var(--v-theme-primary), 0.24) !important;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// Micro-animations for Vuetify components
:deep(.v-switch__track) {
  transition: all 0.3s ease !important;
}

:deep(.v-checkbox .v-selection-control__input) {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  &:hover {
    transform: scale(1.1);
  }
}

:deep(.v-expansion-panel-title) {
  transition: background-color 0.3s ease !important;
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.04) !important;
  }
}

// Custom Scrollbar
.builder-container::-webkit-scrollbar {
  width: 6px;
}
.builder-container::-webkit-scrollbar-track {
  background: transparent;
}
.builder-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), 0.2);
  border-radius: 10px;
}
.builder-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-border-color), 0.4);
}
</style>

<style lang="scss">
.builder-drawer {
  position: fixed !important;
  top: 0 !important;
  height: 100vh !important;
  z-index: 9999 !important;
  
  .v-navigation-drawer__content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>

<route lang="yaml">
meta:
  pageTitle: null
  pageHeader: false
</route>
