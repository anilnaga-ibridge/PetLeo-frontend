import { ofetch } from "ofetch"
import { useCookie } from "@/@core/composable/useCookie"

let isRefreshing = false
let refreshQueue = []

/**
 * Process waiting requests when refresh completes
 */
function processQueue(error, token = null) {
  refreshQueue.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  refreshQueue = []
}

/**
 * Create API instance
 */
export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8003/api/superadmin/",

  // ------------------------
  // 🔹 Attach Access Token
  // ------------------------
  async onRequest({ options }) {
    const accessToken = useCookie("accessToken").value

    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  },

  // ------------------------
  // 🔹 Handle 401 → Refresh
  // ------------------------
  async onResponseError({ response, request, options }) {
    if (response.status !== 401) return

    const originalRequest = { request, options }

    const refresh = localStorage.getItem("opaque_refresh")
    if (!refresh) {
      localStorage.clear()
      window.location.href = "/login"
      
      return
    }

    // Already refreshing → queue request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.options.headers.Authorization = `Bearer ${token}`
        
        return $api(originalRequest.request, originalRequest.options)
      })
    }

    // Start refresh
    isRefreshing = true

    try {
      const refreshRes = await ofetch("http://127.0.0.1:8000/auth/api/auth/refresh-token/", {
        method: "POST",
        body: { refresh },
      })

      const newAccess = refreshRes.access
      const newRefresh = refreshRes.refresh

      localStorage.setItem("accessToken", newAccess)
      localStorage.setItem("opaque_refresh", newRefresh)

      processQueue(null, newAccess)
      isRefreshing = false

      // Retry original request
      originalRequest.options.headers.Authorization = `Bearer ${newAccess}`
      
      return $api(originalRequest.request, originalRequest.options)

    } catch (error) {
      processQueue(error, null)
      isRefreshing = false

      localStorage.clear()
      window.location.href = "/login"

      throw error
    }
  },
})
