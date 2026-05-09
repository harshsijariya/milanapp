import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Get backend URL based on platform
const getBackendUrl = () => {
  // Check if EXPO_PUBLIC_BACKEND_URL is set
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }

  // Fallback URLs by platform
  if (Platform.OS === "android") {
    // Android emulator uses 10.0.2.2 to reach host machine, but physical device uses LAN IP
    return "http://172.20.10.7:8080";
  } else if (Platform.OS === "ios") {
    // iOS simulator can use localhost, but physical uses LAN IP
    return "http://172.20.10.7:8080";
  } else {
    // Web
    return "http://172.20.10.7:8080";
  }
};

const BACKEND_URL = getBackendUrl();
const API_URL = BACKEND_URL + "/api/v1";

console.log("🔧 API Configuration:");
console.log("Platform:", Platform.OS);
console.log("Backend URL:", BACKEND_URL);
console.log("API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor with logging
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("📤 API Request:");
    console.log("Method:", config.method?.toUpperCase());
    console.log("URL:", config.url);
    console.log("Base URL:", config.baseURL);
    console.log("Full URL:", `${config.baseURL}${config.url}`);
    console.log("Headers:", config.headers);
    if (config.data) {
      console.log("Data:", config.data);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor with logging
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:");
    console.log("Status:", response.status);
    console.log("URL:", response.config.url);
    console.log("Data:", response.data);
    return response;
  },
  (error) => {
    console.error("❌ API Error:");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("URL:", error.config?.url);
    console.error("Data:", error.response?.data);
    console.error("Full Error:", error);
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  googleAuth: (data: { email: string; name: string; google_id: string }) =>
    api.post("/auth/google", data),
};

export const profileAPI = {
  getMe: () => api.get("/user"),
  updateProfile: (data: any) => api.patch("/user/profile", data),
  createProfile: (data: any) => api.post("/user/profile", data),
  getProfiles: (page = 0, size = 20) =>
    api.get(`/users?page=${page}&size=${size}`),
  getProfile: (id: string | number) => api.get(`/users/${id}`),
  
  // Split GET Endpoints
  getBasicInfo: () => api.get("/user/profile/basic"),
  getContactInfo: () => api.get("/user/profile/contact"),
  getReligionInfo: () => api.get("/user/profile/religion"),
  getEducationInfo: () => api.get("/user/profile/education"),
  getFamilyInfo: () => api.get("/user/profile/family"),

  // Split PATCH Endpoints
  updateBasicInfo: (data: any) => api.patch("/user/profile/basic", data),
  updateContactInfo: (data: any) => api.patch("/user/profile/contact", data),
  updateReligionInfo: (data: any) => api.patch("/user/profile/religion", data),
  updateEducationInfo: (data: any) => api.patch("/user/profile/education", data),
  updateFamilyInfo: (data: any) => api.patch("/user/profile/family", data),
};

export const likeAPI = {
  likeProfile: (liked_profile_id: number | string) =>
    api.post(`/likes/${liked_profile_id}`),
  unlikeProfile: (profile_id: number | string) =>
    api.delete(`/likes/${profile_id}`),
  getReceivedLikes: () => api.get("/likes"),
  getSentLikes: () => api.get("/likes/me"),
  acceptLike: (liker_id: number | string) =>
    api.post(`/likes/accept/${liker_id}`),
  declineLike: (liker_id: number | string) =>
    api.post(`/likes/reject/${liker_id}`),
};

export const shortlistAPI = {
  add: (shortlist_id: number | string) =>
    api.post(`/shortlist/${shortlist_id}`),
  remove: (profile_id: number | string) =>
    api.delete(`/shortlist/${profile_id}`),
  getAll: () => api.get("/shortlist"),
};

export const viewsAPI = {
  getProfileViews: () => api.get("/views"),
  addView: (data: { viewedId: number | string }) => api.post("/views", data),
};

export default api;
