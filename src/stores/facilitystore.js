import { defineStore } from 'pinia'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'

export const useFacilityStore = defineStore('facilityStore', {
  state: () => ({
    facilities: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchFacilities() {
      this.loading = true
      this.error = null

      try {
        const token = useCookie('accessToken').value

        const res = await axios.get('http://127.0.0.1:8003/api/superadmin/facilities/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        this.facilities = res.data
      } catch (err) {
        this.error = err.response?.data || 'Failed to fetch facilities'
      } finally {
        this.loading = false
      }
    },

    async addFacility(data) {
      try {
        const token = useCookie('accessToken').value

        const res = await axios.post('http://127.0.0.1:8003/api/superadmin/facilities/', data, {
          headers: { Authorization: `Bearer ${token}` }
        })

        this.facilities.push(res.data)
        return res.data

      } catch (err) {
        throw err.response?.data || 'Failed to add facility'
      }
    },

    async deleteFacility(id) {
      try {
        const token = useCookie('accessToken').value
        
        await axios.delete(`http://127.0.0.1:8003/api/superadmin/facilities/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        this.facilities = this.facilities.filter(f => f.id !== id)

      } catch (err) {
        throw err.response?.data || 'Failed to delete facility'
      }
    },
  },
})
