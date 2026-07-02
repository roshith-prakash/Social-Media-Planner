import api from "./axiosInstance";

export const getMe = () => api.get("/users/me");
export const updateMe = (data) => api.put("/users/me", data);
export const deleteMe = () => api.delete("/users/me");
export const completeOnboarding = (data) => api.post("/users/me/onboarding", data);
export const checkUsername = (username) =>
  api.post("/users/check-username", { username });
