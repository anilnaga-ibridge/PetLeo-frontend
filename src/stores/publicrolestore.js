import { defineStore } from "pinia"
import { ref } from "vue"
import axios from "axios"
import { useCookie } from "@/@core/composable/useCookie"

const ROLES_API = "http://127.0.0.1:8000/auth/roles/"

export const usePublicRoleStore = defineStore("publicrolestore", () => {
  const roles = ref([])

  const fetchRoles = async () => {
    try {
      const token = useCookie("accessToken").value

      const res = await axios.get(ROLES_API, {
        headers: { Authorization: `Bearer ${token}` },
      })

      roles.value = res.data.map(role => ({
        id: role.id,
        title: role.name,
        value: role.id,
      }))
    } catch (err) {
      console.error("Failed to load roles:", err)
      roles.value = []
    }
  }

  return { roles, fetchRoles }
})
