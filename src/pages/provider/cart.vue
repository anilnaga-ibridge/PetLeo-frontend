<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { api } from '@/plugins/axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { usePermissionStore } from '@/stores/permissionStore'

const permissionStore = usePermissionStore()
const cart = ref(null)
const loading = ref(false)
const processing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const fetchCart = async () => {
  loading.value = true
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/cart/')

    cart.value = res.data
  } catch (err) {
    console.error('Failed to fetch cart:', err)
  } finally {
    loading.value = false
  }
}

const removeFromCart = async itemId => {
  try {
    await api.delete(`http://127.0.0.1:8002/api/provider/cart/remove/${itemId}/`)
    fetchCart() // Refresh cart
    snackbar.value = { show: true, text: 'Item removed', color: 'success' }
  } catch (err) {
    console.error('Failed to remove item:', err)
    snackbar.value = { show: true, text: 'Failed to remove item', color: 'error' }
  }
}

const router = useRouter()

const checkout = async () => {
  console.log('DEBUG: Checkout button clicked')
  processing.value = true
  try {
    console.log('DEBUG: Sending checkout request...')
    const res = await api.post('http://127.0.0.1:8002/api/provider/cart/checkout/')
    console.log('DEBUG: Checkout request successful', res.data)
    
    // 🔗 IMPORTANT: Refresh permissions immediately after purchase using the immediate SA data
    if (res.data && res.data.sa_data) {
      console.log('🔄 Cart: Injecting permissions from checkout response...')
      permissionStore.injectPurchasedPermissions(res.data.sa_data)
    } else {
      console.log('🔄 Cart: Fallback to fetching permissions...')
      await permissionStore.fetchPermissions() 
    }
    
    snackbar.value = { show: true, text: 'Checkout successful! Plans activated.', color: 'success' }
    cart.value = null // Clear cart locally
    
    // Redirect to dashboard
    router.push({ name: 'provider-dashboard' })
  } catch (err) {
    console.error('Checkout failed:', err)
    snackbar.value = { show: true, text: 'Checkout failed', color: 'error' }
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  fetchCart()
})
</script>

<template>
  <ProviderLayout>
    <div class="pa-4">
      <VRow>
      <VCol cols="12">
        <h2 class="text-h4 mb-4">
          Plan Cart
        </h2>
        <p>Review and checkout your selected plans.</p>
      </VCol>

      <VCol
        v-if="loading"
        cols="12"
      >
        <div class="d-flex justify-center align-center py-12">
          <VProgressCircular
            indeterminate
            color="primary"
            size="64"
          />
        </div>
      </VCol>

      <VCol
        v-else-if="!cart || !cart.items || cart.items.length === 0"
        cols="12"
      >
        <VCard
          class="text-center py-12"
          variant="outlined"
          style="border-style: dashed;"
        >
          <VIcon
            icon="tabler-shopping-cart-off"
            size="64"
            color="disabled"
            class="mb-4"
          />
          <h3 class="text-h5 text-medium-emphasis mb-2">
            Your cart is empty
          </h3>
          <p class="text-body-1 text-disabled mb-6">
            Browse plans to add them to your cart.
          </p>
          <VBtn
            color="primary"
            :to="{ name: 'provider-home' }"
          >
            Browse Plans
          </VBtn>
        </VCard>
      </VCol>

      <VCol
        v-else
        cols="12"
        md="8"
      >
        <VCard class="mb-6">
          <VCardItem title="Cart Items" />
          <VDivider />
          <VList
            lines="two"
            class="pa-0"
          >
            <template
              v-for="(item, index) in cart.items"
              :key="item.id"
            >
              <VListItem class="py-4">
                <template #prepend>
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    size="48"
                    class="me-4"
                  >
                    <VIcon
                      icon="tabler-package"
                      size="24"
                    />
                  </VAvatar>
                </template>
                
                <VListItemTitle class="text-h6 mb-1">
                  {{ item.plan_title }}
                </VListItemTitle>
                <VListItemSubtitle class="text-body-1">
                  {{ item.billing_cycle_name }}
                </VListItemSubtitle>
                
                <template #append>
                  <div class="d-flex align-center gap-4">
                    <span class="text-h6 text-primary">{{ item.price_currency }} {{ item.price_amount }}</span>
                    <VBtn
                      icon="tabler-trash"
                      variant="text"
                      color="error"
                      @click="removeFromCart(item.id)"
                    />
                  </div>
                </template>
              </VListItem>
              <VDivider v-if="index < cart.items.length - 1" />
            </template>
          </VList>
        </VCard>
      </VCol>

      <VCol
        v-if="cart && cart.items && cart.items.length > 0"
        cols="12"
        md="4"
      >
        <VCard>
          <VCardItem title="Order Summary" />
          <VDivider />
          <VCardText class="d-flex flex-column gap-4 py-6">
            <div class="d-flex justify-space-between text-body-1">
              <span>Subtotal</span>
              <span>INR {{ cart.total_amount }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-1">
              <span>Tax</span>
              <span>INR 0.00</span>
            </div>
            <VDivider />
            <div class="d-flex justify-space-between text-h6 font-weight-bold">
              <span>Total</span>
              <span class="text-primary">INR {{ cart.total_amount }}</span>
            </div>
          </VCardText>
          <VCardText>
            <VBtn
              block
              size="large"
              color="primary"
              :loading="processing"
              @click="checkout"
            >
              Checkout
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

      <VSnackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        location="top end"
      >
        {{ snackbar.text }}
      </VSnackbar>
    </div>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
