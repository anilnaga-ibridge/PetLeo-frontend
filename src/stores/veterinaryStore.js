import { defineStore } from 'pinia'
import { superAdminApi } from '@/plugins/axios'
import { veterinaryApi } from '@/api/veterinary'

export const useVeterinaryStore = defineStore('veterinary', {
  state: () => ({
    formDefinitions: {}, // Cache: code -> definition
    currentVisit: null,
    visitList: [],
    pets: [],
    petTypes: [],
    petBreeds: [],
    activeClinicId: localStorage.getItem('activeClinicId'), // [NEW] Read from persistence
    dynamicFieldDefinitions: {}, // [NEW] Cache: entity_type -> definitions
    dynamicFieldValues: {}, // [NEW] Cache: entity_id -> values
    loading: false,
    error: null,
  }),

  actions: {
    setActiveClinic(clinicId) {
      this.activeClinicId = clinicId
      localStorage.setItem('activeClinicId', clinicId)
    },

    async fetchFormDefinition(code) {
      if (this.formDefinitions[code]) return this.formDefinitions[code]

      this.loading = true
      try {
        const response = await veterinaryApi.get(`/veterinary/forms/definitions/${code}/?t=${Date.now()}`)

        this.formDefinitions[code] = response.data

        return response.data
      } catch (err) {
        this.error = err.message
        console.error(`Failed to fetch form definition ${code}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchVisitSummary(visitId) {
      this.loading = true
      try {
        const response = await veterinaryApi.get(`/veterinary/visits/${visitId}/summary/?t=${Date.now()}`)

        this.currentVisit = response.data
        if (response.data.visit?.clinic_id) {
          this.activeClinicId = response.data.visit.clinic_id
          localStorage.setItem('activeClinicId', this.activeClinicId)
        }

        return response.data
      } catch (err) {
        this.error = err.message
        console.error(`Failed to fetch visit summary ${visitId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async submitForm(visitId, formCode, data) {
      this.loading = true
      try {
        const response = await veterinaryApi.post(`/veterinary/visits/${visitId}/submit/${formCode}/`, data)


        // Refresh visit summary to show new submission
        await this.fetchVisitSummary(visitId)

        return response.data
      } catch (err) {
        this.error = err.message
        console.error(`Failed to submit form ${formCode}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateVisitStatus(visitId, status) {
      this.loading = true
      try {
        // Use dedicated transition endpoint for robust state management
        // This bypasses serializer complexity and ensures WorkflowService is authoritative
        const response = await veterinaryApi.post(`/veterinary/visits/${visitId}/transition/`, { status })

        await this.fetchVisitSummary(visitId)

        return response.data
      } catch (err) {
        console.error(`Failed to update visit status ${visitId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPendingVisits(role, clinicId) {
      this.loading = true
      try {
        let endpoint = '/veterinary/visits/'
        const params = { clinic_id: clinicId }

        if (role === 'VITALS_STAFF') {
          params.status = 'CREATED' // Or whatever status indicates pending vitals
        } else if (role === 'DOCTOR') {
          // Doctor sees multiple lists, handled by UI filtering usually, or specific endpoints
          // For now, fetch all active
        }

        const response = await veterinaryApi.get(endpoint, { params })

        this.visitList = response.data

        return response.data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPets() {
      this.loading = true
      try {
        const response = await veterinaryApi.get('/veterinary/pets/')

        this.pets = response.data.results || response.data

        return this.pets
      } catch (err) {
        this.error = err.message
        console.error('Failed to fetch pets:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPetById(petId) {
      this.loading = true
      try {
        const response = await veterinaryApi.get(`/veterinary/pets/${petId}/`)

        return response.data
      } catch (err) {
        console.error(`Failed to fetch pet ${petId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updatePet(petId, petData) {
      this.loading = true
      try {
        const response = await veterinaryApi.patch(`/veterinary/pets/${petId}/`, petData)

        return response.data
      } catch (err) {
        console.error(`Failed to update pet ${petId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deletePet(petId) {
      this.loading = true
      try {
        await veterinaryApi.delete(`/veterinary/pets/${petId}/`)
      } catch (err) {
        console.error(`Failed to delete pet ${petId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async createVisit(visitData) {
      this.loading = true
      try {
        const response = await veterinaryApi.post('/veterinary/visits/', visitData)

        return response.data
      } catch (err) {
        this.error = err.message
        console.error('Failed to create visit:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateVisit(visitId, visitData) {
      this.loading = true
      try {
        const response = await veterinaryApi.patch(`/veterinary/visits/${visitId}/`, visitData)

        return response.data
      } catch (err) {
        console.error(`Failed to update visit ${visitId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteVisit(visitId) {
      this.loading = true
      try {
        await veterinaryApi.delete(`/veterinary/visits/${visitId}/`)
      } catch (err) {
        console.error(`Failed to delete visit ${visitId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchClinics() {
      this.loading = true
      try {
        const response = await veterinaryApi.get('/veterinary/clinics/')
        const clinics = response.data.results || response.data

        // [NEW] Robust Auto-select Logic
        const activeId = this.activeClinicId
        const isValid = activeId && clinics.find(c => c.id === activeId)

        let selectedClinic = isValid ? clinics.find(c => c.id === activeId) : null

        // If no active ID, OR the current active ID is not in the user's list (stale)
        if (!isValid && clinics.length > 0) {
          const primary = clinics.find(c => c.is_primary) || clinics[0]

          this.setActiveClinic(primary.id)
          selectedClinic = primary
        }

        // [NEW] Sync Permissions to PermissionStore
        if (selectedClinic && selectedClinic.permissions) {
          try {
            const { usePermissionStore } = await import('./permissionStore')
            const permStore = usePermissionStore()

            // Map simple string permissions to Store format
            const mapped = selectedClinic.permissions.map(p => ({
              service_key: p,
              service_name: p,
              permissions: { can_view: true }, // [FIX] Nested permissions object as expected by permissionStore
              categories: [{ name: p, permissions: { can_view: true } }], // Self-reference for category checks
            }))

            // Special handling for VETERINARY_CORE to ensure basic access
            if (!mapped.find(p => p.service_key === 'VETERINARY_CORE') && selectedClinic.permissions.includes('VETERINARY_CORE')) {
              // Already added above map
            }

            console.log("Synced Permissions from Clinic:", mapped)
            permStore.permissions = mapped
            localStorage.setItem('provider_permissions', JSON.stringify(mapped))
          } catch (e) {
            console.error("Error syncing permissions:", e)
          }
        }

        return clinics
      } catch (err) {
        this.error = err.message
        console.error('Failed to fetch clinics:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Fetch Dynamic Field Definitions
    async fetchDynamicFieldDefinitions(entityType, clinicId) {
      const key = `${entityType}_${clinicId}`
      if (this.dynamicFieldDefinitions[key]) return this.dynamicFieldDefinitions[key]

      this.loading = true
      try {
        const response = await veterinaryApi.get('/veterinary/field-definitions/', {
          params: { entity_type: entityType, clinic: clinicId },
        })

        this.dynamicFieldDefinitions[key] = response.data.results || response.data

        return this.dynamicFieldDefinitions[key]
      } catch (err) {
        console.error(`Failed to fetch field definitions for ${entityType}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async createDynamicField(data) {
      this.loading = true
      try {
        const response = await veterinaryApi.createField(data)


        // Invalidate cache
        this.dynamicFieldDefinitions = {}

        return response.data
      } catch (err) {
        console.error('Failed to create field:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateDynamicField(fieldId, data) {
      this.loading = true
      try {
        const response = await veterinaryApi.updateField(fieldId, data)

        this.dynamicFieldDefinitions = {}

        return response.data
      } catch (err) {
        console.error(`Failed to update field ${fieldId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteDynamicField(fieldId) {
      this.loading = true
      try {
        await veterinaryApi.deleteField(fieldId)
        this.dynamicFieldDefinitions = {}
      } catch (err) {
        console.error(`Failed to delete field ${fieldId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchForms() {
      this.loading = true
      try {
        const response = await veterinaryApi.getForms()

        return response.data.results || response.data
      } catch (err) {
        console.error('Failed to fetch forms:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async saveFormDefinition(data, code = null) {
      this.loading = true
      try {
        let response
        if (code) {
          response = await veterinaryApi.updateForm(code, data)
        } else {
          response = await veterinaryApi.createForm(data)
        }

        // Clear cached form definitions
        this.formDefinitions = {}

        return response.data
      } catch (err) {
        console.error('Failed to save form definition:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteFormDefinition(code) {
      this.loading = true
      try {
        await veterinaryApi.deleteForm(code)
        delete this.formDefinitions[code]
      } catch (err) {
        console.error(`Failed to delete form ${code}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Save Dynamic Entity Data (Virtual or Real)
    async saveDynamicEntity(clinicId, entityType, data) {
      this.loading = true
      try {
        const payload = {
          clinic_id: clinicId,
          entity_type: entityType,
          data: data,
        }

        const response = await veterinaryApi.post('/veterinary/entities/', payload)

        return response.data
      } catch (err) {
        console.error(`Failed to save dynamic entity ${entityType}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Fetch Visit Queue
    async fetchQueue(queueName, clinicId, filters = {}) {
      // 1. Check for required capability locally to prevent 403 errors
      const REQUIRED_CAPS = {
        'WAITING_ROOM': 'VETERINARY_VISITS',
        'VITALS_QUEUE': 'VETERINARY_VITALS',
        'DOCTOR_QUEUE': 'VETERINARY_DOCTOR',
        'LAB_QUEUE': 'VETERINARY_LABS',
        'PHARMACY_QUEUE': 'VETERINARY_PHARMACY',
      }

      const requiredCap = REQUIRED_CAPS[queueName]
      if (requiredCap) {
        const { usePermissionStore } = await import('./permissionStore')
        const permStore = usePermissionStore()
        if (!permStore.hasCapability(requiredCap)) {
          console.warn(`🛑 fetchQueue: Skipping ${queueName} due to missing capability ${requiredCap}`)

          return []
        }
      }

      this.loading = true
      try {
        const response = await veterinaryApi.get(`/veterinary/visits/queues/${queueName}/`, {
          params: { clinic_id: clinicId, ...filters },
        })

        return response.data
      } catch (err) {
        console.error(`Failed to fetch queue ${queueName}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Fetch Clinic Analytics
    async fetchAnalytics(clinicId, date = null) {
      this.loading = true
      try {
        const params = { clinic_id: clinicId }
        if (date) params.date = date

        const response = await veterinaryApi.get('/veterinary/analytics/dashboard/', { params })

        return response.data
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Fetch Visit Timeline
    async fetchVisitTimeline(visitId) {
      this.loading = true
      try {
        const response = await veterinaryApi.get(`/veterinary/visits/${visitId}/timeline/`)

        return response.data
      } catch (err) {
        console.error(`Failed to fetch timeline for visit ${visitId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Check-in Visit
    async checkInVisit(visitId) {
      this.loading = true
      try {
        const response = await veterinaryApi.post(`/veterinary/visits/${visitId}/check-in/`)

        return response.data
      } catch (err) {
        console.error(`Failed to check-in visit ${visitId}:`, err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Create Pet with optional owner creation
    async createPet(petData) {
      this.loading = true
      try {
        // If owner details are provided but no owner ID, we might need a separate call 
        // but let's assume the backend handles it or we do it here.
        // For now, let's keep it simple and just hit the endpoint.
        const response = await veterinaryApi.post('/veterinary/pets/', petData)

        // Refresh pets list
        await this.fetchPets()

        return response.data
      } catch (err) {
        this.error = err.message
        console.error('Failed to create pet:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updatePet(petId, petData) {
      this.loading = true
      try {
        // [MODIFIED] Role-aware endpoint selection:
        // Providers/Owners get full access, Staff use specialized restricted endpoint.
        let userData = {}
        try {
          userData = JSON.parse(localStorage.getItem('userData') || '{}')
        } catch (e) {
          console.warn('Could not parse userData from localStorage')
        }

        const role = (userData.role || '').toUpperCase()
        const isProvider = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'ORGANIZATION_PROVIDER'].includes(role)

        const endpoint = isProvider
          ? `/veterinary/pets/${petId}/`
          : `/veterinary/pets/${petId}/clinic-update/`

        const response = await veterinaryApi.patch(endpoint, petData)

        await this.fetchPets()

        return response.data
      } catch (err) {
        console.error('Failed to update pet:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deletePet(petId) {
      this.loading = true
      try {
        await veterinaryApi.delete(`/veterinary/pets/${petId}/`)
        await this.fetchPets()
      } catch (err) {
        console.error('Failed to delete pet:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Fetch Pet Types (from Super Admin API)
    async fetchPetTypes() {
      this.loading = true
      try {
        const response = await superAdminApi.get('/api/superadmin/pet-types/')

        this.petTypes = response.data.results || response.data

        return this.petTypes
      } catch (err) {
        console.error('Failed to fetch pet types:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Fetch Pet Breeds (from Super Admin API)
    async fetchPetBreeds() {
      this.loading = true
      try {
        const response = await superAdminApi.get('/api/superadmin/pet-breeds/')

        this.petBreeds = response.data.results || response.data

        return this.petBreeds
      } catch (err) {
        console.error('Failed to fetch pet breeds:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Create Pet Type (Super Admin API)
    async createPetType(name) {
      this.loading = true
      try {
        const response = await superAdminApi.post('/api/superadmin/pet-types/', { name })
        const newType = response.data


        // Add to local list to avoid extra fetch
        this.petTypes.unshift(newType)

        return newType
      } catch (err) {
        console.error('Failed to create pet type:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // [NEW] Create Pet Breed (Super Admin API)
    async createPetBreed(petTypeId, breedName) {
      this.loading = true
      try {
        const response = await superAdminApi.post('/api/superadmin/pet-breeds/', {
          petType: petTypeId,
          breed: breedName,
        })

        const newBreed = response.data


        // Add to local list
        this.petBreeds.unshift(newBreed)

        return newBreed
      } catch (err) {
        console.error('Failed to create pet breed:', err)
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
