import { defineStore } from 'pinia'
import { providerApi } from '@/plugins/axios'

export const useVisitStore = defineStore('visit', {
  state: () => ({
    visits: [],
    currentVisit: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchVisits(params = {}) {
      this.isLoading = true
      try {
        const response = await providerApi.get('/api/provider/visits/', { params })

        this.visits = response.data.results || response.data
      } catch (err) {
        this.error = 'Failed to fetch visits'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchVisitDetail(visitId) {
      this.isLoading = true
      try {
        const response = await providerApi.get(`/api/provider/visits/${visitId}/`)

        this.currentVisit = response.data
      } catch (err) {
        this.error = 'Failed to fetch visit details'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async updateItemStatus(itemId, status) {
      try {
        await providerApi.patch(`/api/provider/items/${itemId}/`, { status })
        if (this.currentVisit) {
          const item = this.currentVisit.items.find(i => i.id === itemId)
          if (item) item.status = status
        }
      } catch (err) {
        console.error('Failed to update item status:', err)
        throw err
      }
    },
  },
})
