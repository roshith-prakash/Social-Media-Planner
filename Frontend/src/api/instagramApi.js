import api from "./axiosInstance";

export const getInstagramLoginUrl = (identifier) => {
  return api.get(`/instagram/login?state=${encodeURIComponent(identifier)}`);
};

export const getInstagramStatus = () => {
  return api.get("/instagram/status");
};

export const disconnectInstagram = () => {
  return api.post("/instagram/disconnect");
};

export const publishToInstagram = (cdnUrl, caption, projectId) => {
  return api.post("/instagram/publish", { cdnUrl, caption, projectId });
};
