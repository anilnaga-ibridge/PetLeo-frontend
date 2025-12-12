// provider-home/api.js
import { api as axios } from "@/plugins/axios";

const BASE = "/api/superadmin/provider-home";

export default {
  getPages() {
    return axios.get(`${BASE}/pages/`);
  },

  getPage(id) {
    return axios.get(`${BASE}/pages/${id}/`);
  },

  createPage(payload) {
    return axios.post(`${BASE}/pages/`, payload);
  },

  updatePage(id, payload) {
    return axios.put(`${BASE}/pages/${id}/`, payload);
  },

  deletePage(id) {
    return axios.delete(`${BASE}/pages/${id}/`);
  },

  // Child sections
  addHero(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/hero-banners/`, payload);
  },

  addSlide(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/banner-slides/`, payload);
  },

  addImage(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/images/`, payload);
  },

  addFeature(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/features/`, payload);
  },

  addTestimonial(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/testimonials/`, payload);
  },

  addVideo(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/videos/`, payload);
  },

  addService(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/services/`, payload);
  },

  addFAQ(homeId, payload) {
    return axios.post(`${BASE}/pages/${homeId}/faqs/`, payload);
  }
};
