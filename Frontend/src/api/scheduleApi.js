import api from "./axiosInstance";

export const schedulePost = (data) => api.post("/schedule", data);
export const publishNow = (data) => api.post("/schedule/now", data);
export const getScheduledPosts = () => api.get("/schedule");
export const cancelScheduledPost = (id) => api.delete(`/schedule/${id}`);
