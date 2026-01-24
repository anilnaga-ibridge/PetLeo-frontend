// src/stores/facilitystore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'

export const useFacilityStore = defineStore('facilitystore', () => {
  const facilities = ref([])
  const loading = ref(false)
  const error = ref(null)

  const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003') + '/api/superadmin/facilities/'

  const fetchFacilities = async () => {
    loading.value = true
    error.value = null
    try {
      const token = useCookie('accessToken').value
      const res = await axios.get(API, { headers: token ? { Authorization: `Bearer ${token}` } : {} })

      facilities.value = res.data.results || res.data || []
    } catch (err) {
      error.value = err
      facilities.value = []
      console.error('fetchFacilities error', err)
    } finally {
      loading.value = false
    }
  }

  return { facilities, loading, error, fetchFacilities }
})
