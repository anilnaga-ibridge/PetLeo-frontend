<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Pricing Rules</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search pricing..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>

          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn color="primary" prepend-icon="tabler-plus" class="px-6" @click="openAddDrawer">
              Add Pricing Rule
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

        <template #item.base_price="{ item }">
          <strong>₹ {{ formatNumber(item.base_price) }}</strong>
        </template>

        <template #item.billing_unit="{ item }">
          <VChip size="small" color="info" variant="tonal">{{ item.billing_unit }}</VChip>
        </template>

        <template #item.duration_minutes="{ item }">
          <div v-if="item.duration_minutes">{{ item.duration_minutes }} min</div>
          <div v-else class="text-medium-emphasis">-</div>
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
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="500" class="pa-4" style="border-left:2px solid #E2E8F0;">
      <div class="pa-3 mb-3 rounded-lg" :style="drawerHeaderStyle">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ isEdit ? 'Update Pricing Rule' : 'Create Pricing Rule' }}</h3>
            <div class="text-caption opacity-90">Configure pricing for services</div>
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

          <!-- Category -->
          <VCol cols="12">
            <AppSelect
              v-model="form.category"
              :items="filteredCategories"
              item-title="name"
              item-value="id"
              label="Category (Optional)"
              placeholder="Select category"
              :disabled="!form.service || filteredCategories.length === 0"
              clearable
            />
          </VCol>

          <!-- Facility -->
          <VCol cols="12">
            <AppSelect
              v-model="form.facility"
              :items="filteredFacilities"
              item-title="name"
              item-value="id"
              label="Facility (Optional)"
              placeholder="Select facility"
              :disabled="!form.service || filteredFacilities.length === 0"
              clearable
            />
          </VCol>

          <VDivider class="my-2" />

          <!-- Billing Unit -->
          <VCol cols="12">
            <AppSelect
              v-model="form.billing_unit"
              :items="billingUnitOptions"
              label="Billing Unit *"
              placeholder="Select billing unit"
              item-title="label"
              item-value="value"
            />
          </VCol>

          <!-- Base Price -->
          <VCol cols="12" sm="6">
            <AppTextField
              v-model.number="form.base_price"
              label="Base Price (₹) *"
              type="number"
              placeholder="0.00"
            />
          </VCol>

          <!-- Duration Minutes -->
          <VCol cols="12" sm="6" v-if="showDurationInput">
            <AppTextField
              v-model.number="form.duration_minutes"
              label="Duration (Minutes)"
              type="number"
              placeholder="e.g. 60"
            />
          </VCol>

          <!-- Status -->
          <VCol cols="12" class="d-flex align-center mt-2">
            <div class="me-3">Active</div>
            <VSwitch v-model="form.is_active" color="success" />
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
          <h2 class="text-h6 font-weight-bold">Delete Pricing Rule?</h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            This action cannot be undone.
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
      { title: 'Billing Unit', key: 'billing_unit' },
      { title: 'Base Price', key: 'base_price' },
      { title: 'Duration', key: 'duration_minutes' },
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
      billing_unit: 'PER_SESSION',
      base_price: 0,
      duration_minutes: null,
      is_active: true
    })

    // filtered lists
    const filteredCategories = computed(() => {
      if (!form.value.service) return []
      return (categoryStore.categories || []).filter(c => {
        const sId = c.service?.id || c.service
        return sId === form.value.service
      })
    })

    const filteredFacilities = computed(() => {
      if (!form.value.service) return []
      return (facilityStore.facilities || []).filter(f => {
        const sId = f.service?.id || f.service
        return sId === form.value.service
      })
    })

    const billingUnitOptions = [
      { label: 'Hourly', value: 'HOURLY' },
      { label: 'Daily', value: 'DAILY' },
      { label: 'Weekly', value: 'WEEKLY' },
      { label: 'Per Session', value: 'PER_SESSION' },
      { label: 'One Time', value: 'ONE_TIME' }
    ]

    const showDurationInput = computed(() => {
      return ['HOURLY', 'PER_SESSION'].includes(form.value.billing_unit)
    })

    const deleteDialog = ref(false)
    const deleteItem = ref(null)

    // helpers
    const formatNumber = (val) => {
      if (val == null) return '0.00'
      const n = Number(val)
      if (isNaN(n)) return val
      return n.toFixed(2)
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
        const res = await axios.get(BASE_URL + 'pricing-rules/', { params }) // Updated Endpoint
        const data = res.data
        const list = data.results || data || []
        pricings.value = list
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
      form.value = {
        service: null,
        category: null,
        facility: null,
        billing_unit: 'PER_SESSION',
        base_price: 0,
        duration_minutes: null,
        is_active: true
      }
      drawerOpen.value = true
    }

    const openEditDrawer = (item) => {
      isEdit.value = true
      editId.value = item.id
      form.value = {
        service: typeof item.service === 'number' ? item.service : (item.service?.id || item.service),
        category: typeof item.category === 'number' ? item.category : (item.category?.id || item.category),
        facility: typeof item.facility === 'number' ? item.facility : (item.facility?.id || item.facility),
        billing_unit: item.billing_unit,
        base_price: item.base_price,
        duration_minutes: item.duration_minutes,
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
          billing_unit: form.value.billing_unit,
          base_price: Number(form.value.base_price) || 0,
          duration_minutes: form.value.duration_minutes ? Number(form.value.duration_minutes) : null,
          is_active: form.value.is_active
        }

        if (isEdit.value && editId.value) {
          await axios.put(BASE_URL + 'pricing-rules/' + editId.value + '/', payload)
        } else {
          await axios.post(BASE_URL + 'pricing-rules/', payload)
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
        await axios.delete(BASE_URL + 'pricing-rules/' + deleteItem.value.id + '/')
        deleteDialog.value = false
        await fetchPricings()
      } catch (err) {
        console.error('Delete failed', err)
        alert('Delete failed')
      }
    }

    const onServiceChange = () => {
      if (isEdit.value) {
        // In edit mode, if service changes, clear children if they don't belong
        if (form.value.category && !filteredCategories.value.find(c => c.id === form.value.category)) form.value.category = null
        if (form.value.facility && !filteredFacilities.value.find(f => f.id === form.value.facility)) form.value.facility = null
      } else {
        // In create mode, just clear them
        form.value.category = null
        form.value.facility = null
      }
    }

    const drawerHeaderStyle = { background: 'linear-gradient(135deg,#42a5f5,#1e88e5)', color: 'white' }

    return {
      pricings, headers, page, itemsPerPage, totalItems, searchQuery, selectedRows,
      drawerOpen, isEdit, form, loading, filteredCategories, filteredFacilities, billingUnitOptions, showDurationInput,
      deleteDialog, deleteItem,
      serviceStore, facilityStore, categoryStore,
      updateOptions, openAddDrawer, openEditDrawer, closeDrawer, submit,
      openDeleteDialog, deletePricing, formatNumber, onServiceChange, drawerHeaderStyle
    }
  }
}
</script>
