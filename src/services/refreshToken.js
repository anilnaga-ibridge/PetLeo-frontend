async function refreshAccessIfExpired() {
  const refresh = localStorage.getItem("refresh")
  if (!refresh) return null

  try {
    const res = await axios.post("http://127.0.0.1:8000/auth/api/auth/refresh-token/", {
      refresh: refresh,
    })

    const newAccess = res.data.access

    localStorage.setItem("accessToken", newAccess)

    return newAccess
  } catch (e) {
    console.log("❌ Refresh token expired or invalid", e)
    
    return null
  }
}
