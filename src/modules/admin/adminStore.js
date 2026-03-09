import { defineStore } from 'pinia'
import { providerApi } from '@/plugins/axios'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    resources: [],
    employees: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchResourceUtilization() {
      this.isLoading = true
      try {
        const response = await providerApi.get('/api/provider/resource-metrics/')

        this.resources = response.data
      } catch (err) {
        console.error('Failed to fetch resource metrics:', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchEmployeeWorkloads() {
      this.isLoading = true
      try {
        const response = await providerApi.get('/api/provider/employee-workloads/')

        this.employees = response.data
      } catch (err) {
        console.error('Failed to fetch employee workloads:', err)
      } finally {
        this.isLoading = false
      }
    },
  },
})
