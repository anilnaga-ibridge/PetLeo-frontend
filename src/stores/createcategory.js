// src/stores/createcategory.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'   // ← same helper

export const useCategoryStore = defineStore('createcategory', () => {
  const loading = ref(false)
  const error = ref(null)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003'
  const CATEGORY_URL = `${API_BASE}/api/superadmin/categories/`

  const createCategory = async payload => {
    loading.value = true
    error.value = null

    try {
      const token = useCookie('accessToken').value
      if (!token) {
        error.value = 'Authentication required.'
        return false
      }

      await axios.post(CATEGORY_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      return true
    } catch (err) {
      error.value = err.response?.data?.detail || err.response?.data?.message || 'Error creating category'
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, createCategory }
})
