<script setup>
import { useCartStore } from '@/stores/cartStore'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const cartStore = useCartStore()
const router = useRouter()
const checkoutLoading = ref(false)

const handleRemove = (itemId) => {
  cartStore.removeItem(itemId)
}

const handleCheckout = async () => {
  checkoutLoading.value = true
  try {
    // In a real app, we'd open an address selection step
    // For now, we'll use a placeholder or assume profile default
    const res = await cartStore.checkout({
      notes: 'Booking from cart'
    })
    
    emit('update:modelValue', false)
    router.push('/pet-owner/dashboard')
    alert('Booking successful!')
  } catch (err) {
    console.error('Checkout failed', err)
    alert('Checkout failed. Please try again.')
  } finally {
    checkoutLoading.value = false
  }
}

import { computed } from 'vue'

const totalCartValue = computed(() => {
    return cartStore.cartItems.reduce((sum, item) => sum + parseFloat(item.price_snapshot || 0), 0).toFixed(2)
})

const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD'
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<template>
  <VNavigationDrawer
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    location="right"
    temporary
    width="400"
    class="cart-drawer"
  >
    <div class="d-flex flex-column fill-height">
      <!-- Header -->
      <div class="pa-6 border-b d-flex align-center justify-space-between bg-slate-50">
        <div>
          <h2 class="text-h6 font-weight-black text-slate-900">Your Selection</h2>
          <p class="text-caption text-slate-500 mb-0">{{ cartStore.itemCount }} items ready to book</p>
        </div>
        <VBtn icon="tabler-x" variant="text" density="comfortable" @click="emit('update:modelValue', false)" />
      </div>

      <!-- Items List -->
      <div class="flex-grow-1 overflow-y-auto pa-4">
        <div v-if="cartStore.itemCount === 0" class="empty-cart text-center py-16">
          <VIcon icon="tabler-shopping-cart-x" size="64" color="slate-200" class="mb-4" />
          <h3 class="text-h6 font-weight-bold text-slate-400">Cart is empty</h3>
          <p class="text-body-2 text-slate-400 mt-2 px-8">Add some services to get started with your booking.</p>
        </div>
        
        <div v-else class="d-flex flex-column gap-4">
          <VCard 
            v-for="item in cartStore.cartItems" 
            :key="item.id" 
            flat 
            border 
            rounded="xl" 
            class="cart-item-card px-4 py-4"
          >
            <div class="d-flex align-start gap-3">
              <VAvatar size="48" color="primary-subtle" rounded="lg">
                <VIcon icon="tabler-paw" color="primary" />
              </VAvatar>
              <div class="flex-grow-1">
                <div class="d-flex justify-space-between align-start">
                  <h4 class="text-subtitle-2 font-weight-bold text-slate-900">
                    {{ item.pet_details?.name || 'My Pet' }}
                  </h4>
                  <VBtn 
                    icon="tabler-trash" 
                    variant="text" 
                    size="x-small" 
                    color="error" 
                    density="comfortable"
                    @click="handleRemove(item.id)"
                  />
                </div>
                <p class="text-caption text-slate-500 mb-2">Facility: {{ item.facility_id }}</p>
                
                <div class="d-flex align-center text-caption font-weight-bold text-primary bg-primary-subtle px-2 py-1 rounded w-fit">
                  <VIcon icon="tabler-calendar-time" size="14" class="mr-1" />
                  {{ formatDate(item.selected_time) }}
                </div>
                
                <!-- Add-ons summary if any -->
                <div v-if="item.selected_addons?.length > 0" class="mt-2">
                   <div class="text-caption text-slate-400 uppercase font-weight-black" style="font-size: 8px">Add-ons</div>
                   <div class="d-flex flex-wrap gap-1 mt-1">
                      <VChip 
                        v-for="(addon, idx) in item.selected_addons" 
                        :key="idx" 
                        size="x-small" 
                        variant="tonal" 
                        color="slate-500"
                        class="px-2"
                      >
                         <span class="font-weight-bold mr-1">{{ typeof addon === 'object' ? addon.name : 'Add-on' }}</span>
                         <span v-if="typeof addon === 'object' && addon.price" class="text-primary">+₹{{ addon.price }}</span>
                      </VChip>
                   </div>
                </div>
              </div>
            </div>
          </VCard>
        </div>
      </div>

      <!-- Footer / Checkout -->
      <div v-if="cartStore.itemCount > 0" class="pa-6 border-t bg-white">
        <div class="d-flex justify-space-between align-center mb-6">
          <span class="text-subtitle-1 font-weight-bold text-slate-500">Total Price</span>
          <span class="text-h5 font-weight-black text-primary">₹{{ totalCartValue }}</span>
        </div>
        
        <VBtn
          block
          color="primary"
          size="x-large"
          height="60"
          class="rounded-xl font-weight-black"
          :loading="checkoutLoading"
          @click="handleCheckout"
        >
          Confirm & Book Selection
        </VBtn>
        <p class="text-center text-caption text-slate-400 mt-4">
          All items will be booked in a single transaction.
        </p>
      </div>
    </div>
  </VNavigationDrawer>
</template>

<style scoped>
.cart-drawer {
  background: rgba(255, 255, 255, 0.98) !important;
}

.cart-item-card {
  transition: all 0.2s ease;
  border-color: #f1f5f9 !important;
}

.cart-item-card:hover {
  border-color: #6366f1 !important;
  background: #f8faff;
}

.primary-subtle {
  background: #eef2ff;
}

.w-fit { width: fit-content; }
</style>
