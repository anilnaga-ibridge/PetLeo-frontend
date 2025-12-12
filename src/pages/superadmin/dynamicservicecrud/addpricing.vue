<!-- <script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { useServiceStore } from '@/stores/servicestore'
import { useCategoryStore } from '@/stores/categorystore'
import { useFacilityStore } from '@/stores/facilitystore'

const API_URL = 'http://127.0.0.1:8003/api/superadmin/pricing/'

// ✅ Load required dropdown data
const serviceStore = useServiceStore()
const categoryStore = useCategoryStore()
const facilityStore = useFacilityStore()

onMounted(() => {
  serviceStore.fetchServices()
  categoryStore.fetchCategories()
  facilityStore.fetchFacilities()
})

// ✅ Form Data
const pricing = ref({
  service: null,
  category: null,
  facility: null,
  price: '',
  duration: '',
  discount: '',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// ✅ Submit Handler
const addPricing = async () => {
  const token = useCookie('accessToken').value

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const res = await axios.post(API_URL, pricing.value, {
      headers: { Authorization: `Bearer ${token}` }
    })

    successMessage.value = '✅ Pricing added successfully!'
    console.log(res.data)

    pricing.value = { service: null, category: null, facility: null, price: '', duration: '', discount: '', is_active: true }

  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to add pricing.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VCard max-width="650" class="pa-5">
    <h3 class="mb-4">Add Pricing</h3>

    <VAlert v-if="successMessage" type="success" variant="tonal">{{ successMessage }}</VAlert>
    <VAlert v-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</VAlert>

    <VForm @submit.prevent="addPricing">
      
      <VSelect
        label="Select Service"
        :items="serviceStore.services"
        item-title="display_name"
        item-value="id"
        v-model="pricing.service"
        required
      />

      <VSelect
        class="mt-3"
        label="Select Category"
        :items="categoryStore.categories"
        item-title="display_name"
        item-value="id"
        v-model="pricing.category"
        required
      />

      <VSelect
        class="mt-3"
        label="Select Facility"
        :items="facilityStore.facilities"
        item-title="name"
        item-value="id"
        v-model="pricing.facility"
        required
      />

      <AppTextField class="mt-3" label="Price" type="number" v-model="pricing.price" required />

      <VSelect
        class="mt-3"
        label="Duration"
        :items="['per_hour', 'per_day', 'per_week', 'per_month']"
        v-model="pricing.duration"
        required
      />

      <AppTextField class="mt-3" label="Discount (%)" type="number" v-model="pricing.discount" />

      <VCheckbox class="mt-3" label="Active" v-model="pricing.is_active" />

      <VBtn type="submit" class="mt-4" :loading="loading">
        Save Pricing
      </VBtn>
    </VForm>
  </VCard>
</template> -->
<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Pricing</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search pricing (service, category, facility)..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>

          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn color="primary" prepend-icon="tabler-plus" class="px-6" @click="openAddDrawer">
              Add Pricing
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="pricings"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        show-select
        @update:options="updateOptions"
      >
        <template #item.service_display="{ item }">
          <strong class="text-primary">{{ item.service_display }}</strong>
        </template>

        <template #item.category_display="{ item }">
          <div>{{ item.category_display || '-' }}</div>
        </template>

        <template #item.facility_display="{ item }">
          <div>{{ item.facility_display || '-' }}</div>
        </template>

        <template #item.price="{ item }">
          <div>₹ {{ formatNumber(item.price) }}</div>
        </template>

        <template #item.discount="{ item }">
          <div v-if="item.discount">{{ item.discount }}%</div>
          <div v-else class="text-medium-emphasis">—</div>
        </template>

        <template #item.duration="{ item }">
          <div class="text-capitalize">{{ item.duration }}</div>
        </template>

        <template #item.final_price="{ item }">
          <strong>₹ {{ formatNumber(computeFinalPriceNumber(item.price, item.discount)) }}</strong>
        </template>

        <template #item.is_active="{ item }">
          <VChip size="small" color="success" v-if="item.is_active">Active</VChip>
          <VChip size="small" color="error" v-else>Inactive</VChip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-x-1">
            <IconBtn @click="openEditDrawer(item)"><VIcon icon="tabler-edit" /></IconBtn>
            <IconBtn color="red" @click="openDeleteDialog(item)"><VIcon icon="tabler-trash" /></IconBtn>
          </div>
        </template>

        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalItems" />
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Drawer -->
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="520" class="pa-4" style="border-left:2px solid #E2E8F0;">
      <div class="pa-3 mb-3 rounded-lg" :style="drawerHeaderStyle">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ isEdit ? 'Update Pricing' : 'Create Pricing' }}</h3>
            <div class="text-caption opacity-90">Link price to service / category / facility</div>
          </div>
          <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
        </div>
      </div>

      <VForm>
        <VRow>
          <!-- Service -->
          <VCol cols="12">
            <AppSelect
              v-model="form.service"
              :items="serviceStore.services"
              item-title="display_name"
              item-value="id"
              label="Service *"
              placeholder="Select service"
              @update:model-value="onServiceChange"
              clearable
            />
          </VCol>

          <!-- Category (filtered by service) -->
          <VCol cols="12">
            <AppSelect
              v-model="form.category"
              :items="filteredCategories"
              :item-title="item => item.name || item.display_name || 'Unknown'"
              item-value="id"
              label="Category (optional)"
              placeholder="Select category"
              :disabled="!form.service || filteredCategories.length === 0"
              clearable
            />
          </VCol>

          <!-- Facility (filtered by service) -->
          <VCol cols="12">
            <AppSelect
              v-model="form.facility"
              :items="filteredFacilities"
              item-title="name"
              item-value="id"
              label="Facility (optional)"
              placeholder="Select facility"
              :disabled="!form.service || filteredFacilities.length === 0"
              clearable
            />
          </VCol>

          <!-- Price -->
          <VCol cols="12" sm="6">
            <AppTextField v-model.number="form.price" label="Price (₹)" type="number" placeholder="0.00" />
          </VCol>

          <!-- Discount -->
          <VCol cols="12" sm="6">
            <AppTextField v-model.number="form.discount" label="Discount (%)" type="number" placeholder="e.g. 10" />
          </VCol>

          <!-- Duration -->
          <VCol cols="12" sm="6">
            <AppSelect v-model="form.duration" :items="durationOptions" label="Duration" item-title="label" item-value="value" />
          </VCol>

          <!-- Status -->
          <VCol cols="12" sm="6" class="d-flex align-center">
            <div class="me-3">Active</div>
            <VSwitch v-model="form.is_active" color="success" />
          </VCol>

          <!-- Price preview -->
          <VCol cols="12">
            <VCard class="pa-3 rounded-lg" elevation="2" style="background: linear-gradient(90deg,#F0F9FF,#F3F6FF);">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-caption">Base</div>
                  <div class="text-h6">₹ {{ formatNumber(form.price || 0) }}</div>
                </div>

                <div>
                  <div class="text-caption">Discount</div>
                  <div class="text-h6">{{ form.discount ? form.discount + '%' : '—' }}</div>
                </div>

                <div>
                  <div class="text-caption">Final</div>
                  <div class="text-h5 font-weight-bold">₹ {{ formatNumber(computeFinalPriceNumber(form.price || 0, form.discount)) }}</div>
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VForm>

      <div class="d-flex justify-end mt-4 gap-2">
        <VBtn variant="text" @click="closeDrawer">Cancel</VBtn>
        <VBtn :loading="loading" color="primary" style="background:linear-gradient(135deg,#42a5f5,#1e88e5);" @click="submit">
          {{ isEdit ? 'Update' : 'Create' }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- Delete confirm -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold">Delete Pricing?</h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Delete <strong class="text-primary">{{ deleteItem?.service_display }}{{ displayIf(deleteItem?.category_display) }}{{ displayIf(deleteItem?.facility_display) }}</strong> permanently?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="red" prepend-icon="tabler-trash" @click="deletePricing">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>

<script>
import axios from 'axios'
import { ref, computed, onMounted, watch } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'

import { useServiceStore } from '@/stores/servicestore'
import { useFacilityStore } from '@/stores/facilitystore'
import { useCategoryStore } from '@/stores/createcategory'

export default {
  name: 'PricingPage',
  setup () {
    const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003') + '/api/superadmin/'

    // apply token
    const token = useCookie('accessToken').value
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // stores
    const serviceStore = useServiceStore()
    const facilityStore = useFacilityStore()
    const categoryStore = useCategoryStore()

    // local reactive
    const pricings = ref([])
    const headers = [
      { title: 'Service', key: 'service_display' },
      { title: 'Category', key: 'category_display' },
      { title: 'Facility', key: 'facility_display' },
      { title: 'Price', key: 'price' },
      { title: 'Discount', key: 'discount' },
      { title: 'Duration', key: 'duration' },
      { title: 'Final Price', key: 'final_price' },
      { title: 'Active', key: 'is_active' },
      { title: 'Actions', key: 'actions', sortable: false }
    ]

    const page = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const searchQuery = ref('')
    const selectedRows = ref([])

    // drawer / form
    const drawerOpen = ref(false)
    const isEdit = ref(false)
    const loading = ref(false)
    const editId = ref(null)

    const form = ref({
      service: null,
      category: null,
      facility: null,
      price: 0,
      duration: 'per_day',
      discount: null,
      is_active: true
    })

    // filtered lists (both categories & facilities filtered by selected service)
    const filteredCategories = computed(() => {
      if (!form.value.service) return categoryStore.categories || []
      return (categoryStore.categories || []).filter(c => {
        // backend might return c.service as number or {id:..}
        return c.service === form.value.service || (c.service?.id && c.service.id === form.value.service)
      })
    })

    const filteredFacilities = computed(() => {
      if (!form.value.service) return []
      return (facilityStore.facilities || []).filter(f => {
        return f.service === form.value.service || (f.service?.id && f.service.id === form.value.service)
      })
    })

    const durationOptions = [
      { label: 'Per Day', value: 'per_day' },
      { label: 'Per Hour', value: 'per_hour' },
      { label: 'Per Session', value: 'per_session' }
    ]

    const deleteDialog = ref(false)
    const deleteItem = ref(null)

    // helpers
    const formatNumber = (val) => {
      if (val == null) return '0.00'
      const n = Number(val)
      if (isNaN(n)) return val
      return n.toFixed(2)
    }

    const computeFinalPriceNumber = (price, discount) => {
      const p = Number(price) || 0
      const d = Number(discount) || 0
      const finalP = d ? p - (p * (d / 100)) : p
      return Number(finalP.toFixed(2))
    }

    const displayIf = (s) => {
      if (!s) return ''
      return ` - ${s}`
    }

    // fetch lists & pricings
    const fetchAllLists = async () => {
      await Promise.all([
        serviceStore.fetchServices(),
        facilityStore.fetchFacilities(),
        categoryStore.fetchCategories()
      ])
    }

    const fetchPricings = async () => {
      try {
        const params = { page: page.value, page_size: itemsPerPage.value, search: searchQuery.value }
        const res = await axios.get(BASE_URL + 'pricing/', { params })
        const data = res.data
        const list = data.results || data || []
        pricings.value = (list || []).map(item => {
          const out = { ...item }
          // service display
          if (!out.service_display) {
            if (out.service?.display_name) out.service_display = out.service.display_name
            else if (out.service_name) out.service_display = out.service_name
            else out.service_display = typeof out.service === 'number' ? (serviceStore.services.find(s => s.id === out.service)?.display_name || out.service) : (out.service?.display_name || '')
          }
          // category display
          if (!out.category_display) {
            if (out.category?.display_name) out.category_display = out.category.display_name
            else if (out.category?.name) out.category_display = out.category.name
            else out.category_display = typeof out.category === 'number' ? (categoryStore.categories.find(c => c.id === out.category)?.display_name || '') : (out.category || '')
          }
          // facility display
          if (!out.facility_display) {
            if (out.facility?.name) out.facility_display = out.facility.name
            else out.facility_display = typeof out.facility === 'number' ? (facilityStore.facilities.find(f => f.id === out.facility)?.name || '') : (out.facility || '')
          }
          out.price = out.price != null ? Number(out.price) : 0
          out.discount = out.discount != null ? Number(out.discount) : null
          return out
        })
        totalItems.value = data.count || (Array.isArray(list) ? list.length : 0)
      } catch (err) {
        console.error('fetchPricings error', err)
        pricings.value = []
        totalItems.value = 0
      }
    }

    onMounted(async () => {
      await fetchAllLists()
      await fetchPricings()
    })

    watch([page, itemsPerPage, searchQuery], fetchPricings)

    const updateOptions = () => fetchPricings()

    // actions
    const openAddDrawer = () => {
      isEdit.value = false
      editId.value = null
      form.value = { service: null, category: null, facility: null, price: 0, duration: 'per_day', discount: null, is_active: true }
      drawerOpen.value = true
    }

    const openEditDrawer = (item) => {
      isEdit.value = true
      editId.value = item.id
      form.value = {
        service: typeof item.service === 'number' ? item.service : (item.service?.id || null),
        category: typeof item.category === 'number' ? item.category : (item.category?.id || item.category || null),
        facility: typeof item.facility === 'number' ? item.facility : (item.facility?.id || item.facility || null),
        price: item.price,
        duration: item.duration || 'per_day',
        discount: item.discount,
        is_active: item.is_active
      }
      drawerOpen.value = true
    }

    const closeDrawer = () => { drawerOpen.value = false }

    const submit = async () => {
      loading.value = true
      try {
        const payload = {
          service: form.value.service,
          category: form.value.category || null,
          facility: form.value.facility || null,
          price: Number(form.value.price) || 0,
          duration: form.value.duration,
          discount: form.value.discount !== null ? Number(form.value.discount) : null,
          is_active: form.value.is_active
        }

        if (isEdit.value && editId.value) {
          await axios.put(BASE_URL + 'pricing/' + editId.value + '/', payload)
        } else {
          await axios.post(BASE_URL + 'pricing/', payload)
        }

        drawerOpen.value = false
        await fetchPricings()
      } catch (err) {
        console.error('Save pricing failed', err)
        alert(err.response?.data?.detail || 'Save failed')
      } finally {
        loading.value = false
      }
    }

    // delete
    const openDeleteDialog = (item) => {
      deleteItem.value = item
      deleteDialog.value = true
    }

    const deletePricing = async () => {
      if (!deleteItem.value) return
      try {
        await axios.delete(BASE_URL + 'pricing/' + deleteItem.value.id + '/')
        deleteDialog.value = false
        await fetchPricings()
      } catch (err) {
        console.error('Delete failed', err)
        alert('Delete failed')
      }
    }

    const onServiceChange = () => {
      // clear dependent fields when service changes
      if (form.value.category && !filteredCategories.value.find(c => c.id === form.value.category)) form.value.category = null
      if (form.value.facility && !filteredFacilities.value.find(f => f.id === form.value.facility)) form.value.facility = null
    }

    const drawerHeaderStyle = { background: 'linear-gradient(135deg,#42a5f5,#1e88e5)', color: 'white' }

    return {
      pricings, headers, page, itemsPerPage, totalItems, searchQuery, selectedRows,
      drawerOpen, isEdit, form, loading, filteredCategories, filteredFacilities, durationOptions,
      deleteDialog, deleteItem,
      serviceStore, facilityStore, categoryStore,
      updateOptions, openAddDrawer, openEditDrawer, closeDrawer, submit,
      openDeleteDialog, deletePricing, formatNumber, computeFinalPriceNumber, displayIf, onServiceChange, drawerHeaderStyle
    }
  }
}
</script>
