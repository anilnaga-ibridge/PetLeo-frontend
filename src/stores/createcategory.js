// src/stores/createcategory.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'

export const useCategoryStore = defineStore('createcategory', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8003'
  const CATEGORY_URL = `${API_BASE}/api/superadmin/categories/`

  const fetchCategories = async () => {
    loading.value = true
    error.value = null
    try {
      const token = useCookie('accessToken').value
      const res = await axios.get(CATEGORY_URL, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      categories.value = res.data.results || res.data || []
    } catch (err) {
      error.value = err
      categories.value = []
      console.error('fetchCategories error', err)
    } finally {
      loading.value = false
    }
  }

  const createCategory = async payload => {
    loading.value = true
    error.value = null
    try {
      const token = useCookie('accessToken').value
      if (!token) {
        error.value = 'Authentication required.'
        return false
      }
      const res = await axios.post(CATEGORY_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // push new category into local state for instant UX
      categories.value.unshift(res.data)
      return res.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.response?.data?.message || 'Error creating category'
      console.error('createCategory error', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, error, fetchCategories, createCategory }
})
