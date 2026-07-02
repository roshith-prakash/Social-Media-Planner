import api from "./axiosInstance";

export const analyzeVideo = (projectId) =>
  api.post("/analysis/analyze", { projectId });
export const getAnalysisByProjectId = (projectId) =>
  api.get(`/analysis/project/${projectId}`);
export const getAnalysisById = (id) => api.get(`/analysis/${id}`);
export const regenerateAgent = (analysisId, agent) =>
  api.post(`/analysis/${analysisId}/regenerate`, { agent });
