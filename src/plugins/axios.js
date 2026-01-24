
// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8003",
// });

// // SET TOKEN AUTOMATICALLY
// const access = localStorage.getItem("accessToken");
// if (access) {
//   api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
// }

// // Prevent multiple refresh calls
// let isRefreshing = false;
// let failedQueue = [];

// function processQueue(error, token = null) {
//   failedQueue.forEach(p => {
//     if (error) p.reject(error);
//     else p.resolve(token);
//   });
//   failedQueue = [];
// }

// api.interceptors.response.use(
//   res => res,
//   async err => {
//     const originalRequest = err.config;

//     // If 401 → try refresh
//     if (err.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       const refresh = localStorage.getItem("opaque_refresh");
//       if (!refresh) return Promise.reject(err);

//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then(token => {
//             originalRequest.headers["Authorization"] = "Bearer " + token;
//             return api(originalRequest);
//           })
//           .catch(e => Promise.reject(e));
//       }

//       isRefreshing = true;

//       try {
//         const res = await axios.post(
//           `${api.defaults.baseURL}/auth/api/auth/refresh-token/`,
//           { refresh }
//         );

//         const newAccess = res.data.access;
//         const newRefresh = res.data.refresh;

//         localStorage.setItem("accessToken", newAccess);
//         localStorage.setItem("opaque_refresh", newRefresh);

//         api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;

//         processQueue(null, newAccess);

//         isRefreshing = false;

//         originalRequest.headers["Authorization"] = "Bearer " + newAccess;
//         return api(originalRequest);
//       } catch (refreshErr) {
//         processQueue(refreshErr, null);
//         isRefreshing = false;

//         localStorage.clear();
//         window.location.href = "/login";

//         return Promise.reject(refreshErr);
//       }
//     }

//     return Promise.reject(err);
//   }
// );

// export default api;
import axios from "axios"

// Service URLs from environment or defaults
const AUTH_URL = import.meta.env.VITE_AUTH_API_URL || "http://127.0.0.1:8000"
const PROVIDER_URL = import.meta.env.VITE_PROVIDER_API_URL || "http://127.0.0.1:8002"
const SUPERADMIN_URL = import.meta.env.VITE_SUPERADMIN_API_URL || "http://127.0.0.1:8003"
const VETERINARY_URL = import.meta.env.VITE_VETERINARY_API_URL || "http://127.0.0.1:8004"

// Create instances for each service
const authApi = axios.create({ baseURL: AUTH_URL })
const providerApi = axios.create({ baseURL: PROVIDER_URL })
const superAdminApi = axios.create({ baseURL: SUPERADMIN_URL })
const veterinaryApi = axios.create({ baseURL: VETERINARY_URL })

// Default 'api' instance (legacy support, defaults to Super Admin or Gateway)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || SUPERADMIN_URL,
})

const instances = [authApi, providerApi, superAdminApi, veterinaryApi, api]

// =======================================================
// 🔥 ALWAYS attach latest token before every request
// =======================================================
instances.forEach(instance => {
  instance.interceptors.request.use(
    config => {
      let token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")

      // Fallback: Check cookie if not in storage
      if (!token) {
        const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'))
        if (match) {
          token = decodeURIComponent(match[2])

          // If it was stringified JSON (e.g. "token"), remove quotes
          if (token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1)
          }
        }
      }

      if (token) {
        // console.log(`🚀 Axios: Attaching token to ${config.url}`);
        config.headers["Authorization"] = `Bearer ${token}`
      } else {
        console.warn(`🚀 Axios: No token found for ${config.url}. Cookies: ${document.cookie}`)
      }

      return config
    },
    error => Promise.reject(error),
  )
})

// [NEW] Specialized Header for Veterinary Service Clinic Context
veterinaryApi.interceptors.request.use(config => {
  const clinicId = localStorage.getItem('activeClinicId')
  if (clinicId) {
    config.headers["X-Clinic-ID"] = clinicId
  }
  
  return config
})

// =======================================================
// REFRESH TOKEN LOGIC
// =======================================================
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

instances.forEach(instance => {
  instance.interceptors.response.use(
    res => res,
    async err => {
      const originalRequest = err.config

      if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        const refresh = localStorage.getItem("opaque_refresh")
        if (!refresh) return Promise.reject(err)

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(token => {
              originalRequest.headers["Authorization"] = "Bearer " + token
              
              return instance(originalRequest)
            })
            .catch(e => Promise.reject(e))
        }

        isRefreshing = true

        try {
          // Refresh always goes to Auth Service
          const res = await axios.post(
            `${AUTH_URL}/auth/api/auth/refresh-token/`,
            { refresh },
          )

          const newAccess = res.data.access
          const newRefresh = res.data.refresh

          localStorage.setItem("accessToken", newAccess)
          localStorage.setItem("opaque_refresh", newRefresh)

          processQueue(null, newAccess)
          isRefreshing = false

          originalRequest.headers["Authorization"] = "Bearer " + newAccess
          
          return instance(originalRequest)

        } catch (refreshErr) {
          processQueue(refreshErr, null)
          isRefreshing = false
          localStorage.clear()
          window.location.href = "/login"
          
          return Promise.reject(refreshErr)
        }
      }

      // =======================================================
      // 🚨 GLOBAL API ERROR HANDLING
      // =======================================================
      const status = err.response?.status
      const url = err.config?.url
      const method = err.config?.method?.toUpperCase()
      const message = err.response?.data?.error || err.response?.data?.message || err.message

      console.error(`[API ERROR] ${method} ${url} | Status: ${status}`)
      if (err.response?.data) {
        console.error('Response Data:', JSON.stringify(err.response.data, null, 2))
      } else {
        console.error('Message:', message)
      }

      if (status === 500) {
        console.error("Critical Backend Error (500). Please check backend logs.")
      } else if (status === 404) {
        console.warn(`Endpoint Not Found (404): ${url}`)
      } else if (status === 403) {
        console.warn("Permission Denied (403). Missing required capability.")
      }

      return Promise.reject(err)
    },
  )
})

export { api, authApi, providerApi, superAdminApi, veterinaryApi }
export default function (app) {
  app.config.globalProperties.$axios = api
  app.provide('axios', api)
  app.provide('authApi', authApi)
  app.provide('providerApi', providerApi)
  app.provide('superAdminApi', superAdminApi)
  app.provide('veterinaryApi', veterinaryApi)
}
