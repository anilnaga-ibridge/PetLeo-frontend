<script setup>
import { onMounted, computed } from 'vue'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()

onMounted(() => {
  cartStore.fetchCart()
})

const items = computed(() => cartStore.cartItems)
const isLoading = computed(() => cartStore.loading)

const updateQty = (id, delta) => {
  // Logic to update quantity in the real store if available
  // For now, many PetLeo carts are simple add/remove
  console.log('Update qty:', id, delta)
}

const removeItem = id => {
  cartStore.removeItem(id)
}

const subtotal = computed(() => {
  return items.value.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (item.quantity || 1)), 0)
})

const tax = computed(() => subtotal.value * 0.1)
const total = computed(() => subtotal.value + tax.value)
</script>

<template>
  <VCard
    elevation="0"
    border
    class="rounded-xl h-100 d-flex flex-column"
  >
    <VCardTitle class="text-h6 font-weight-bold d-flex justify-space-between align-center px-6 pt-6 pb-4">
      <div class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-shopping-cart"
          color="primary"
          size="24"
        />
        Booking Cart
      </div>
      <VChip
        color="primary"
        variant="tonal"
        size="small"
        class="font-weight-bold"
      >
        {{ items.length }} Items
      </VChip>
    </VCardTitle>

    <VCardText class="flex-grow-1 overflow-y-auto px-6 pb-2">
      <div
        v-if="items.length === 0"
        class="d-flex flex-column align-center justify-center h-100 text-medium-emphasis py-8"
      >
        <VIcon
          icon="tabler-shopping-cart-off"
          size="48"
          class="mb-3 opacity-50"
        />
        <span class="text-body-2 text-center">Cart is empty.<br>Add services to start booking.</span>
      </div>

      <div
        v-else
        class="d-flex flex-column gap-3"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="cart-item d-flex justify-space-between align-center p-3 rounded-lg border bg-surface-variant-lighten-1"
        >
          <div>
            <div class="text-body-2 font-weight-bold text-high-emphasis">
              {{ item.name }}
            </div>
            <div class="text-body-2 font-weight-bold text-primary mt-1">
              ${{ item.price || 0 }}
            </div>
          </div>
          
          <div class="d-flex align-center gap-3">
            <div class="d-flex align-center bg-surface border rounded-lg px-1">
              <VBtn
                icon
                variant="text"
                density="comfortable"
                size="x-small"
                color="medium-emphasis"
                @click="updateQty(item.id, -1)"
              >
                <VIcon icon="tabler-minus" />
              </VBtn>
              <span class="text-caption font-weight-bold px-2 w-px-20 text-center">{{ item.quantity || 1 }}</span>
              <VBtn
                icon
                variant="text"
                density="comfortable"
                size="x-small"
                color="medium-emphasis"
                @click="updateQty(item.id, 1)"
              >
                <VIcon icon="tabler-plus" />
              </VBtn>
            </div>

            <VBtn
              icon
              variant="tonal"
              color="error"
              density="comfortable"
              size="small"
              class="rounded-lg"
              @click="removeItem(item.id)"
            >
              <VIcon
                icon="tabler-trash"
                size="18"
              />
            </VBtn>
          </div>
        </div>
      </div>
    </VCardText>

    <VCardText class="mt-auto px-6 pb-6 pt-4 border-t">
      <div class="d-flex flex-column gap-2 mb-4">
        <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
          <span>Subtotal</span>
          <span class="font-weight-bold text-high-emphasis">${{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
          <span>Tax (10%)</span>
          <span class="font-weight-bold text-high-emphasis">${{ tax.toFixed(2) }}</span>
        </div>
        <VDivider class="my-1" />
        <div class="d-flex justify-space-between text-h6 font-weight-bold">
          <span>Total</span>
          <span class="text-primary">${{ total.toFixed(2) }}</span>
        </div>
      </div>

      <VBtn
        block
        color="primary"
        size="large"
        class="font-weight-bold rounded-xl btn-primary-shadow"
        :disabled="items.length === 0"
      >
        Proceed to Booking
      </VBtn>
    </VCardText>
  </VCard>
</template>

<style scoped>
.cart-item {
  padding: 12px;
  transition: all 0.2s ease;
}

.cart-item:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.5) !important;
}

.w-px-20 {
  width: 25px;
}

.btn-primary-shadow {
  box-shadow: 0 4px 14px 0 rgba(var(--v-theme-primary), 0.35) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary-shadow:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(var(--v-theme-primary), 0.45) !important;
}
</style>
