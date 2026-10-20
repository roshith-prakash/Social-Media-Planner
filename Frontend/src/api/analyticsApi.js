import api from "./axiosInstance";

export const getProjectAnalytics = (projectId) => api.get(`/analytics/${projectId}`);
