<script setup>
import { ref, computed, watch } from 'vue'
import { useBookingStore } from '../bookingStore'
import TimelinePreview from './TimelinePreview.vue'

const bookingStore = useBookingStore()

const steps = [
  { title: 'Select Pet', icon: 'tabler-dog' },
  { title: 'Add Services', icon: 'tabler-plus' },
  { title: 'Plan Workflow', icon: 'tabler-timeline' },
  { title: 'Confirm', icon: 'tabler-check' },
]

const currentStep = ref(0)
const petSearch = ref('')
const serviceSearch = ref('')

// Mock data for prototype - in real app, these come from respective stores
const pets = ref([
  { id: 'pet1', name: 'Buddy', breed: 'Golden Retriever', owner: 'Praveen' },
  { id: 'pet2', name: 'Luna', breed: 'Indie', owner: 'Anil' },
])

const availableServices = ref([
  { service_id: 's1', name: 'General Consultation', duration_minutes: 30, base_price: 500, category: 'Medical' },
  { service_id: 's2', name: 'Full Grooming', duration_minutes: 90, base_price: 1500, category: 'Grooming' },
  { service_id: 's3', name: 'Vaccination', duration_minutes: 15, base_price: 300, category: 'Medical' },
])

const handlePetSelect = pet => {
  bookingStore.selectedPet = pet
  currentStep.value = 1
}

const toggleService = service => {
  const existing = bookingStore.cartItems.find(i => i.service_id === service.service_id)
  if (existing) {
    bookingStore.removeServiceFromCart(existing.tempId)
  } else {
    bookingStore.addServiceToCart({ ...service, organization_id: 'org1' })
  }
}

const planVisit = async () => {
  if (!bookingStore.selectedDate) {
    bookingStore.selectedDate = new Date().toISOString().split('T')[0]
  }
  await bookingStore.planVisit()
}

const handleCheckout = async () => {
  try {
    const visit = await bookingStore.checkout()


    // Handle success (e.g., navigate to visit detail)
    console.log('Visit Created:', visit)
  } catch (e) {
    // Error is handled in store
  }
}

// Watchers for step transitions
watch(currentStep, val => {
  if (val === 2) {
    planVisit()
  }
})
</script>

<template>
  <VCard class="enterprise-booking-cart">
    <VCardText class="pa-0">
      <VRow no-gutters>
        <!-- Left: Steps & Cart -->
        <VCol
          cols="12"
          md="8"
          class="border-e pa-6"
        >
          <div class="d-flex align-center mb-6">
            <VIcon
              icon="tabler-smart-home"
              class="me-2"
              color="primary"
            />
            <h3 class="text-h5 font-weight-bold">
              Multi-Service Cart
            </h3>
          </div>

          <VStepper
            v-model="currentStep"
            :items="steps"
            hide-actions
            class="elevation-0 mb-6"
          >
            <template #item.1>
              <div class="py-4">
                <VTextField
                  v-model="petSearch"
                  label="Search Patient (Pet)"
                  prepend-inner-icon="tabler-search"
                  variant="outlined"
                  class="mb-4"
                />
                <VList
                  lines="two"
                  border
                  rounded
                >
                  <VListItem
                    v-for="pet in pets"
                    :key="pet.id"
                    :title="pet.name"
                    :subtitle="`${pet.breed} • Owner: ${pet.owner}`"
                    :active="bookingStore.selectedPet?.id === pet.id"
                    @click="handlePetSelect(pet)"
                  >
                    <template #prepend>
                      <VAvatar
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon icon="tabler-dog" />
                      </VAvatar>
                    </template>
                  </VListItem>
                </VList>
              </div>
            </template>

            <template #item.2>
              <div class="py-4">
                <div class="d-flex align-center justify-space-between mb-4">
                  <h6 class="text-h6">
                    Select Services
                  </h6>
                  <VTextField
                    v-model="serviceSearch"
                    label="Search services..."
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 250px"
                  />
                </div>
                <VRow>
                  <VCol
                    v-for="s in availableServices"
                    :key="s.service_id"
                    cols="12"
                    sm="6"
                  >
                    <VCard 
                      variant="outlined" 
                      :color="bookingStore.cartItems.some(i => i.service_id === s.service_id) ? 'primary' : ''"
                      class="cursor-pointer"
                      @click="toggleService(s)"
                    >
                      <VCardText class="pa-4 d-flex align-center">
                        <div class="flex-grow-1">
                          <div class="font-weight-bold">
                            {{ s.name }}
                          </div>
                          <div class="text-caption">
                            {{ s.duration_minutes }} min • ₹{{ s.base_price }}
                          </div>
                        </div>
                        <VIcon 
                          :icon="bookingStore.cartItems.some(i => i.service_id === s.service_id) ? 'tabler-circle-check-filled' : 'tabler-circle-plus'" 
                          :color="bookingStore.cartItems.some(i => i.service_id === s.service_id) ? 'primary' : 'secondary'"
                        />
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </template>

            <template #item.3>
              <div class="py-4">
                <div class="d-flex align-center justify-space-between mb-6">
                  <h6 class="text-h6">
                    Operational Workflow
                  </h6>
                  <VBtnToggle
                    v-model="bookingStore.executionMode"
                    mandatory
                    color="primary"
                    density="compact"
                  >
                    <VBtn value="SEQUENTIAL">
                      Sequential
                    </VBtn>
                    <VBtn value="PARALLEL">
                      Parallel
                    </VBtn>
                  </VBtnToggle>
                </div>

                <VAlert
                  v-if="bookingStore.error"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ bookingStore.error.error || bookingStore.error.message }}
                  <div
                    v-if="bookingStore.error.code"
                    class="text-caption mt-1"
                  >
                    Code: {{ bookingStore.error.code }}
                  </div>
                </VAlert>

                <TimelinePreview 
                  :items="bookingStore.plannedItems" 
                  :is-loading="bookingStore.isPlanning"
                />
              </div>
            </template>

            <template #item.4>
              <div class="py-4 text-center">
                <VIcon
                  icon="tabler-circle-check"
                  size="64"
                  color="success"
                  class="mb-4"
                />
                <h4 class="text-h4 mb-2">
                  Ready to Book
                </h4>
                <p class="text-muted mb-6">
                  All systems cleared. All resources locked.
                </p>
                            
                <VList
                  border
                  rounded
                  class="text-start mx-auto"
                  style="max-width: 400px"
                >
                  <VListItem 
                    v-for="(item, idx) in bookingStore.plannedItems" 
                    :key="idx"
                    :title="item.name"
                    :subtitle="`${item.employee_name || 'Assigned Staff'} • ${new Date(item.start_dt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`"
                  />
                  <VDivider />
                  <VListItem class="bg-light">
                    <div class="d-flex justify-space-between w-100">
                      <span class="font-weight-bold">Total Cost</span>
                      <span class="text-h6 font-weight-bold text-primary">₹ {{ bookingStore.cartItems.reduce((acc, i) => acc + i.base_price, 0) }}</span>
                    </div>
                  </VListItem>
                </VList>
              </div>
            </template>
          </VStepper>

          <div class="d-flex justify-space-between mt-auto pt-6">
            <VBtn
              variant="tonal"
              color="secondary"
              :disabled="currentStep === 0"
              @click="currentStep--"
            >
              Back
            </VBtn>
            <VBtn 
              v-if="currentStep < steps.length - 1" 
              color="primary" 
              :disabled="currentStep === 0 && !bookingStore.selectedPet || currentStep === 1 && bookingStore.cartItems.length === 0"
              @click="currentStep++"
            >
              Continue
            </VBtn>
            <VBtn
              v-else
              color="success"
              @click="handleCheckout"
            >
              Confirm Booking
            </VBtn>
          </div>
        </VCol>

        <!-- Right: Summary Sidebar -->
        <VCol
          cols="12"
          md="4"
          class="bg-var-theme-background pa-6"
        >
          <h6 class="text-h6 mb-4">
            Summary
          </h6>
                
          <div
            v-if="bookingStore.selectedPet"
            class="mb-6"
          >
            <div class="text-caption text-uppercase text-muted mb-1">
              Patient
            </div>
            <div class="d-flex align-center">
              <VAvatar
                size="32"
                color="primary"
                class="me-2"
                variant="tonal"
              >
                <VIcon
                  icon="tabler-dog"
                  size="18"
                />
              </VAvatar>
              <div>
                <div class="font-weight-bold line-height-1">
                  {{ bookingStore.selectedPet.name }}
                </div>
                <div class="text-caption">
                  {{ bookingStore.selectedPet.breed }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="bookingStore.cartItems.length > 0">
            <div class="text-caption text-uppercase text-muted mb-2">
              Cart ({{ bookingStore.cartItems.length }} items)
            </div>
            <div
              v-for="item in bookingStore.cartItems"
              :key="item.tempId"
              class="d-flex align-center mb-3"
            >
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium">
                  {{ item.name }}
                </div>
                <div class="text-caption">
                  {{ item.duration_minutes }} min
                </div>
              </div>
              <div class="text-body-2 font-weight-bold">
                ₹{{ item.base_price }}
              </div>
            </div>
            <VDivider class="my-3" />
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2">Subtotal</span>
              <span class="text-body-2">₹{{ bookingStore.cartItems.reduce((acc, i) => acc + i.base_price, 0) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-2">Discounts</span>
              <span class="text-body-2 text-success">-₹0.00</span>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span class="text-h6">Total</span>
              <span class="text-h5 font-weight-bold text-primary">₹{{ bookingStore.cartItems.reduce((acc, i) => acc + i.base_price, 0) }}</span>
            </div>
          </div>
          <div
            v-else
            class="text-center py-10"
          >
            <VIcon
              icon="tabler-shopping-cart"
              size="48"
              color="secondary"
              variant="tonal"
              class="mb-2"
            />
            <div class="text-muted">
              Empty Cart
            </div>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.enterprise-booking-cart {
    border-radius: 12px;
    overflow: hidden;
}
</style>
