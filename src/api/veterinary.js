import { veterinaryApi as api } from '@/plugins/axios'

// The veterinaryApi from axios already has the baseURL and interceptors.
// We decorate it with our semantic methods.

export const veterinaryApi = api

// --- Field Definitions (Admin) ---
veterinaryApi.getFields = params => {
  return api.get('/api/veterinary/field-definitions/', { params })
}
veterinaryApi.createField = data => {
  return api.post('/api/veterinary/field-definitions/', data)
}
veterinaryApi.updateField = (id, data) => {
  return api.put(`/api/veterinary/field-definitions/${id}/`, data)
}
veterinaryApi.deleteField = id => {
  return api.delete(`/api/veterinary/field-definitions/${id}/`)
}

// --- Clinic & Reception ---
veterinaryApi.getClinics = () => {
  return api.get('/api/veterinary/clinics/')
}
veterinaryApi.createOwner = data => {
  return api.post('/api/veterinary/owners/', data)
}
veterinaryApi.createPet = data => {
  return api.post('/api/veterinary/pets/', data)
}
veterinaryApi.savePetDynamicData = (petId, data) => {
  return api.post(`/api/veterinary/pets/${petId}/dynamic_data/`, data)
}
veterinaryApi.getPetHistory = petId => {
  return api.get(`/api/veterinary/pets/${petId}/history/`)
}

// --- Visits ---
veterinaryApi.createVisit = data => {
  return api.post('/api/veterinary/visits/', data)
}
veterinaryApi.getVisits = params => {
  return api.get('/api/veterinary/visits/', { params })
}
veterinaryApi.getVisit = id => {
  return api.get(`/api/veterinary/visits/${id}/`)
}
veterinaryApi.transitionVisit = (id, status) => {
  return api.post(`/api/veterinary/visits/${id}/transition/`, { status })
}
veterinaryApi.saveVitals = (visitId, data) => {
  return api.post(`/api/veterinary/visits/${visitId}/vitals/`, data)
}

// --- Form Definitions (Global/Schema) ---
veterinaryApi.getForms = () => {
  return api.get('/api/veterinary/forms/definitions/')
}
veterinaryApi.createForm = data => {
  return api.post('/api/veterinary/forms/definitions/', data)
}
veterinaryApi.updateForm = (code, data) => {
  return api.put(`/api/veterinary/forms/definitions/${code}/`, data)
}
veterinaryApi.deleteForm = code => {
  return api.delete(`/api/veterinary/forms/definitions/${code}/`)
}

// --- Virtual Entities (Prescriptions, Labs, etc.) ---
veterinaryApi.createEntity = data => {
  return api.post('/api/veterinary/entities/', data)
}

// --- Analytics ---
veterinaryApi.getAnalytics = params => {
  return api.get('/api/veterinary/analytics/dashboard/', { params })
}

veterinaryApi.getSummary = params => {
  return api.get('/api/veterinary/analytics/summary/', { params })
}

// --- Medical Appointments ---
veterinaryApi.getMedicalAppointments = params => {
  return api.get('/api/veterinary/appointments/', { params })
}
veterinaryApi.createMedicalAppointment = data => {
  return api.post('/api/veterinary/appointments/', data)
}
veterinaryApi.getVeterinaryAvailability = (clinicId, params) => {
  return api.get(`/api/veterinary/availability/${clinicId}/slots/`, { params })
}

// --- Master Catalog & Inventory ---
veterinaryApi.getMedicines = params => {
  return api.get('/api/veterinary/catalog/medicines/', { params })
}
veterinaryApi.createMedicine = data => {
  return api.post('/api/veterinary/catalog/medicines/', data)
}
veterinaryApi.updateMedicine = (id, data) => {
  return api.patch(`/api/veterinary/catalog/medicines/${id}/`, data)
}
veterinaryApi.deleteMedicine = id => {
  return api.delete(`/api/veterinary/catalog/medicines/${id}/`)
}
veterinaryApi.dispenseMedicines = (prescriptionId) => {
  return api.post('/api/veterinary/pharmacy/dispense/', { prescription_id: prescriptionId })
}

veterinaryApi.getLabTests = params => {
  return api.get('/api/veterinary/catalog/lab-tests/', { params })
}
