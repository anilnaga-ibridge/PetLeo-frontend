import { veterinaryApi as api } from '@/plugins/axios'

// The veterinaryApi from axios already has the baseURL and interceptors.
// We decorate it with our semantic methods.

export const veterinaryApi = api

// --- Field Definitions (Admin) ---
veterinaryApi.getFields = params => {
  return api.get('/veterinary/field-definitions/', { params })
}
veterinaryApi.createField = data => {
  return api.post('/veterinary/field-definitions/', data)
}
veterinaryApi.updateField = (id, data) => {
  return api.put(`/veterinary/field-definitions/${id}/`, data)
}
veterinaryApi.deleteField = id => {
  return api.delete(`/veterinary/field-definitions/${id}/`)
}

// --- Clinic & Reception ---
veterinaryApi.getClinics = () => {
  return api.get('/veterinary/clinics/')
}
veterinaryApi.createOwner = data => {
  return api.post('/veterinary/owners/', data)
}
veterinaryApi.createPet = data => {
  return api.post('/veterinary/pets/', data)
}
veterinaryApi.savePetDynamicData = (petId, data) => {
  return api.post(`/veterinary/pets/${petId}/dynamic_data/`, data)
}

// --- Visits ---
veterinaryApi.createVisit = data => {
  return api.post('/veterinary/visits/', data)
}
veterinaryApi.getVisits = params => {
  return api.get('/veterinary/visits/', { params })
}
veterinaryApi.getVisit = id => {
  return api.get(`/veterinary/visits/${id}/`)
}
veterinaryApi.transitionVisit = (id, status) => {
  return api.post(`/veterinary/visits/${id}/transition/`, { status })
}
veterinaryApi.saveVitals = (visitId, data) => {
  return api.post(`/veterinary/visits/${visitId}/vitals/`, data)
}

// --- Form Definitions (Global/Schema) ---
veterinaryApi.getForms = () => {
  return api.get('/veterinary/forms/definitions/')
}
veterinaryApi.createForm = data => {
  return api.post('/veterinary/forms/definitions/', data)
}
veterinaryApi.updateForm = (code, data) => {
  return api.put(`/veterinary/forms/definitions/${code}/`, data)
}
veterinaryApi.deleteForm = code => {
  return api.delete(`/veterinary/forms/definitions/${code}/`)
}

// --- Virtual Entities (Prescriptions, Labs, etc.) ---
veterinaryApi.createEntity = data => {
  return api.post('/veterinary/entities/', data)
}

// --- Analytics ---
veterinaryApi.getAnalytics = (params) => {
  return api.get('/veterinary/analytics/dashboard/', { params })
}

veterinaryApi.getSummary = (params) => {
  return api.get('/veterinary/analytics/summary/', { params })
}
