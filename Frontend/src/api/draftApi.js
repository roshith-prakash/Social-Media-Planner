import api from "./axiosInstance";

export const createDraft = (data) => api.post("/drafts", data);
export const getMyDrafts = (page = 1) => api.get(`/drafts?page=${page}`);
export const getDraftById = (id) => api.get(`/drafts/${id}`);
export const updateDraft = (id, data) => api.put(`/drafts/${id}`, data);
export const toggleFavorite = (id) => api.patch(`/drafts/${id}/favorite`);
export const deleteDraft = (id) => api.delete(`/drafts/${id}`);
