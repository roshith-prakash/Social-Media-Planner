import api from "./axiosInstance";

export const getUploadSignature = () => api.get("/videos/upload-signature");
export const createVideoProject = (data) => api.post("/videos", data);
export const getMyProjects = (page = 1, limit = 12) =>
  api.get(`/videos?page=${page}&limit=${limit}`);
export const getProjectById = (id) => api.get(`/videos/${id}`);
export const deleteProject = (id) => api.delete(`/videos/${id}`);
export const getSignedUrl = (publicId) => api.get(`/videos/signed/${encodeURIComponent(publicId)}`);

