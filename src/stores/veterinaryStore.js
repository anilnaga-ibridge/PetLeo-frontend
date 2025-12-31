import { defineStore } from 'pinia'
import { veterinaryApi } from '@/plugins/axios'

export const useVeterinaryStore = defineStore('veterinary', {
    state: () => ({
        formDefinitions: {}, // Cache: code -> definition
        currentVisit: null,
        visitList: [],
        pets: [],
        activeClinicId: null, // [NEW]
        dynamicFieldDefinitions: {}, // [NEW] Cache: entity_type -> definitions
        dynamicFieldValues: {}, // [NEW] Cache: entity_id -> values
        loading: false,
        error: null,
    }),

    actions: {
        setActiveClinic(clinicId) {
            this.activeClinicId = clinicId
        },

        async fetchFormDefinition(code) {
            if (this.formDefinitions[code]) return this.formDefinitions[code]

            this.loading = true
            try {
                const response = await veterinaryApi.get(`/veterinary/forms/definitions/${code}/`)
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
                const response = await veterinaryApi.get(`/veterinary/visits/${visitId}/summary/`)
                this.currentVisit = response.data
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

        async fetchClinics() {
            this.loading = true
            try {
                const response = await veterinaryApi.get('/veterinary/clinics/')
                return response.data.results || response.data
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
                    params: { entity_type: entityType, clinic: clinicId }
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

        // [NEW] Save Dynamic Entity Data (Virtual or Real)
        async saveDynamicEntity(clinicId, entityType, data) {
            this.loading = true
            try {
                const payload = {
                    clinic_id: clinicId,
                    entity_type: entityType,
                    data: data
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
        async fetchQueue(queueName, clinicId) {
            this.loading = true
            try {
                const response = await veterinaryApi.get(`/veterinary/visits/queues/${queueName}/`, {
                    params: { clinic_id: clinicId }
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
        async fetchAnalytics(clinicId) {
            this.loading = true
            try {
                const response = await veterinaryApi.get('/veterinary/analytics/dashboard/', {
                    params: { clinic_id: clinicId }
                })
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

        // [NEW] Create Pet
        async createPet(petData) {
            this.loading = true
            try {
                const response = await veterinaryApi.post('/veterinary/pets/', petData)
                return response.data
            } catch (err) {
                console.error('Failed to create pet:', err)
                throw err
            } finally {
                this.loading = false
            }
        }
    },
})
