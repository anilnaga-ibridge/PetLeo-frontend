import { defineStore } from 'pinia'
import { providerApi, customerApi } from '@/plugins/axios'

const uuidv4 = () => crypto.randomUUID()

export const useBookingStore = defineStore('booking', {
  state: () => ({
    selectedPet: null,
    cartItems: [],
    executionMode: 'SEQUENTIAL', // 'SEQUENTIAL' | 'PARALLEL'
    selectedDate: null,
    plannedItems: [],
    isPlanning: false,
    idempotencyKey: null,
    error: null,
  }),

  actions: {
    addServiceToCart(service) {
      this.cartItems.push({
        ...service,
        tempId: uuidv4(),
        facility_id: service.facility_id || service.default_facility_id,
        preferred_start: null,
      })
      this.error = null
      this.plannedItems = []
    },

    removeServiceFromCart(tempId) {
      this.cartItems = this.cartItems.filter(item => item.tempId !== tempId)
      this.plannedItems = []
    },

    clearCart() {
      this.cartItems = []
      this.plannedItems = []
      this.idempotencyKey = null
    },

    async planVisit() {
      if (!this.selectedPet || this.cartItems.length === 0 || !this.selectedDate) return

      this.isPlanning = true
      this.error = null

      try {
        // Prepare items for the backend
        const items = this.cartItems.map(item => ({
          service_id: item.service_id,
          facility_id: item.facility_id,
          pet_id: this.selectedPet.id,
          preferred_start: `${this.selectedDate}T10:00:00Z`, // Default to 10 AM for planning, UI will allow adjustment
        }))

        // Note: In a real flow, we might call a separate 'preview' endpoint
        // But for now, we'll use the coordinator logic via a "dry-run" if available
        // or just local simulation for UI feedback.

        // For now, let's assume we call the create_visit with a dry_run flag or a specialized planner endpoint
        // Since we refactored the backend, let's assume we have a planner endpoint
        const response = await providerApi.post('/api/provider/create_visit/', {
          items,
          organization_id: this.cartItems[0].organization_id, // assuming all items from same org
          dry_run: true,
        })

        this.plannedItems = response.data.planned_items || []
      } catch (err) {
        this.error = err.response?.data || { message: 'Failed to plan visit' }
        console.error('Visit planning failed:', err)
      } finally {
        this.isPlanning = false
      }
    },

    async checkout() {
      if (!this.selectedPet || this.cartItems.length === 0) return

      if (!this.idempotencyKey) {
        this.idempotencyKey = uuidv4()
      }

      try {
        const payload = {
          organization_id: this.cartItems[0].organization_id,
          items: this.cartItems.map((item, index) => {
            const planned = this.plannedItems[index]
            
            return {
              service_id: item.service_id,
              facility_id: item.facility_id,
              pet_id: this.selectedPet.id,
              preferred_start: planned ? planned.start_dt : `${this.selectedDate}T10:00:00Z`,
            }
          }),
          idempotency_key: this.idempotencyKey,
        }

        const response = await providerApi.post('/api/provider/create_visit/', payload)

        this.clearCart()
        
        return response.data
      } catch (err) {
        this.error = err.response?.data || { message: 'Checkout failed' }
        throw err
      }
    },
  },
})
