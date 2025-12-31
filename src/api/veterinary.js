
import { api } from '@/plugins/axios';

// Base URL for Veterinary Service
// In production, this should be via Kong Gateway. For now, direct port 8004.
const VET_API_URL = 'http://localhost:8004/api/v1';

export const veterinaryApi = {
    // --- Field Definitions (Admin) ---
    getFields(params) {
        return api.get(`${VET_API_URL}/field-definitions/`, { params });
    },
    createField(data) {
        return api.post(`${VET_API_URL}/field-definitions/`, data);
    },

    // --- Clinic & Reception ---
    getClinics() {
        return api.get(`${VET_API_URL}/clinics/`);
    },
    createOwner(data) {
        return api.post(`${VET_API_URL}/owners/`, data);
    },
    createPet(data) {
        return api.post(`${VET_API_URL}/pets/`, data);
    },
    savePetDynamicData(petId, data) {
        return api.post(`${VET_API_URL}/pets/${petId}/dynamic_data/`, data);
    },

    // --- Visits ---
    createVisit(data) {
        return api.post(`${VET_API_URL}/visits/`, data);
    },
    getVisits(params) {
        return api.get(`${VET_API_URL}/visits/`, { params });
    },
    getVisit(id) {
        return api.get(`${VET_API_URL}/visits/${id}/`);
    },
    transitionVisit(id, status) {
        return api.post(`${VET_API_URL}/visits/${id}/transition/`, { status });
    },
    saveVitals(visitId, data) {
        return api.post(`${VET_API_URL}/visits/${visitId}/vitals/`, data);
    },

    // --- Virtual Entities (Prescriptions, Labs, etc.) ---
    createEntity(data) {
        return api.post(`${VET_API_URL}/entities/`, data);
    }
};
