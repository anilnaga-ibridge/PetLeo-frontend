
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
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8003",
});

// =======================================================
// 🔥 ALWAYS attach latest token before every request
// =======================================================
api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// =======================================================
// REFRESH TOKEN LOGIC (your code kept)
// =======================================================
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  res => res,

  async err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("opaque_refresh");
      if (!refresh) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch(e => Promise.reject(e));
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8003"}/auth/api/auth/refresh-token/`,
          { refresh }
        );

        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;

        localStorage.setItem("accessToken", newAccess);
        localStorage.setItem("opaque_refresh", newRefresh);

        processQueue(null, newAccess);
        isRefreshing = false;

        originalRequest.headers["Authorization"] = "Bearer " + newAccess;
        return api(originalRequest);

      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
