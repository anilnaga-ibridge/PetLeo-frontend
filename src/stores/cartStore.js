import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { customerApi } from '@/plugins/axios'

export const useCartStore = defineStore('cart', () => {
    const cart = ref(null)
    const loading = ref(false)

    const cartItems = computed(() => cart.value?.items || [])
    const itemCount = computed(() => cart.value?.item_count || 0)

    const fetchCart = async () => {
        loading.value = true
        try {
            const res = await customerApi.get('/api/pet-owner/cart/')
            cart.value = Array.isArray(res.data) ? res.data[0] : res.data
        } catch (err) {
            console.error('Failed to fetch cart:', err)
        } finally {
            loading.value = false
        }
    }

    const addItem = async (itemData) => {
        try {
            const res = await customerApi.post('/api/pet-owner/cart/add-item/', itemData)
            cart.value = res.data
            return true
        } catch (err) {
            console.error('Failed to add to cart:', err)
            throw err
        }
    }

    const removeItem = async (itemId) => {
        try {
            const res = await customerApi.delete(`/api/pet-owner/cart/remove-item/${itemId}/`)
            cart.value = res.data
        } catch (err) {
            console.error('Failed to remove from cart:', err)
        }
    }

    const clearCart = async () => {
        try {
            await customerApi.post('/api/pet-owner/cart/clear/')
            cart.value = { items: [], item_count: 0 }
        } catch (err) {
            console.error('Failed to clear cart:', err)
        }
    }

    const checkout = async (checkoutData) => {
        try {
            const res = await customerApi.post('/api/pet-owner/cart/checkout/', checkoutData)
            cart.value = { items: [], item_count: 0 }
            return res.data
        } catch (err) {
            console.error('Checkout failed:', err)
            throw err
        }
    }

    // Auto-fetch on init ONLY for pet owners
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    const role = (userData.role?.name || userData.role || '').toLowerCase()
    const isPetOwner = ['petowner', 'pet_owner', 'pet owner', 'customer'].includes(role)

    if (isPetOwner) {
        fetchCart()
    }

    const isOpen = ref(false)
    const toggleCart = () => isOpen.value = !isOpen.value
    const openCart = () => isOpen.value = true
    const closeCart = () => isOpen.value = false

    return {
        cart,
        loading,
        cartItems,
        itemCount,
        fetchCart,
        addItem,
        removeItem,
        clearCart,
        checkout,
        isOpen,
        toggleCart,
        openCart,
        closeCart
    }
})
