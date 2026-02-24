<script setup>
import { ref, computed, onMounted } from 'vue'
import { customerApi } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'

const bookings = ref([])
const loading = ref(false)
const searchQuery = ref('')

const fetchBookings = async () => {
  loading.value = true
  try {
    const res = await customerApi.get('/api/pet-owner/bookings/bookings/')
    bookings.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
  } finally {
    loading.value = false
  }
}

const customers = computed(() => {
  const map = new Map()
  
  bookings.value.forEach(booking => {
    const owner = booking.owner_details
    if (owner && owner.auth_user_id && !map.has(owner.auth_user_id)) {
      map.set(owner.auth_user_id, {
        ...owner,
        lastBooking: booking.selected_time,
        petNames: new Set([booking.pet_details?.name].filter(Boolean))
      })
    } else if (owner && owner.auth_user_id) {
      const existing = map.get(owner.auth_user_id)
      if (booking.pet_details?.name) existing.petNames.add(booking.pet_details.name)
      if (new Date(booking.selected_time) > new Date(existing.lastBooking)) {
        existing.lastBooking = booking.selected_time
      }
    }
  })
  
  let list = Array.from(map.values())

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => 
      c.full_name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q)
    )
  }
  
  return list.sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
})

onMounted(fetchBookings)
</script>

<template>
  <ProviderLayout>
    <div class="pa-6">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold mb-1">My Customers</h1>
          <p class="text-subtitle-1 text-medium-emphasis">Pet owners you have served</p>
        </div>
        
        <VTextField
          v-model="searchQuery"
          prepend-inner-icon="tabler-search"
          placeholder="Search customers..."
          density="compact"
          variant="solo"
          class="rounded-xl"
          style="max-width: 280px"
          hide-details
        />
      </div>

      <VCard class="rounded-xl border overflow-hidden">
        <VDataTable
          :headers="[
            { title: 'Customer', key: 'full_name' },
            { title: 'Email', key: 'email' },
            { title: 'Contact Number', key: 'phone_number' },
            { title: 'Pets', key: 'petNames' },
            { title: 'Last Visit', key: 'lastBooking' },
            { title: 'Actions', key: 'actions', sortable: false },
          ]"
          :items="customers"
          :loading="loading"
          hover
        >
          <template #item.full_name="{ item }">
            <div class="d-flex align-center py-2">
              <VAvatar color="primary" variant="tonal" class="me-3" size="38">
                <span class="text-xs">{{ item.full_name?.split(' ').map(n => n[0]).join('') }}</span>
              </VAvatar>
              <div class="d-flex flex-column">
                <span class="font-weight-bold text-slate-800">{{ item.full_name }}</span>
                <span class="text-caption text-slate-400">ID: {{ item.auth_user_id.split('-')[0] }}</span>
              </div>
            </div>
          </template>

          <template #item.petNames="{ item }">
            <div class="d-flex flex-wrap gap-1">
              <VChip 
                v-for="pet in Array.from(item.petNames)" 
                :key="pet" 
                size="x-small"
                variant="tonal"
                color="info"
              >
                {{ pet }}
              </VChip>
            </div>
          </template>

          <template #item.lastBooking="{ item }">
            <div class="d-flex flex-column">
              <span class="text-body-2 font-weight-medium">
                {{ new Date(item.lastBooking).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </span>
              <span class="text-caption text-slate-400">
                {{ new Date(item.lastBooking).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
          </template>

          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-mail"
              variant="text"
              color="primary"
              size="small"
              :href="`mailto:${item.email}`"
            />
            <VBtn
              icon="tabler-calendar-plus"
              variant="text"
              color="secondary"
              size="small"
              :to="{ name: 'employee-bookings', query: { search: item.full_name } }"
            />
          </template>
        </VDataTable>
      </VCard>
    </div>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
