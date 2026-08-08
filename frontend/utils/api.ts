import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";
// The imperative router, because this runs in an interceptor rather than a
// component - there is no hook context here.
import { router } from "expo-router";

const BACKEND_PORT = 8080;

/**
 * The host the JS bundle was served from, e.g. "192.168.1.14:8081".
 *
 * Metro already knows the machine's current address, so deriving the backend
 * host from it means the app follows the laptop across networks instead of
 * pointing at whatever IP happened to be baked into .env. Hardcoded LAN
 * addresses die every time you switch Wi-Fi or drop a personal hotspot.
 */
const metroHost = (): string | null => {
  const uri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as any)?.debuggerHost ??
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ??
    null;

  if (!uri) return null;
  const host = String(uri).split("/")[0].split(":")[0];
  return host || null;
};

const getBackendUrl = () => {
  // An explicitly set EXPO_PUBLIC_BACKEND_URL always wins, in dev as well as
  // release. Setting it is a deliberate act - "point the emulator at
  // production" - and auto-detection quietly overriding it is worse than the
  // stale-value problem the old ordering avoided.
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (configured) {
    // Trailing slashes produce //api/v1, which some proxies 404.
    return configured.replace(/\/+$/, "");
  }

  // Otherwise in development, follow Metro: it already knows the machine's
  // current address, so the app follows the laptop across networks instead of
  // pointing at whatever IP was baked in.
  if (__DEV__) {
    const host = metroHost();
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:${BACKEND_PORT}`;
    }

    // Metro on localhost means the bundle came over `adb reverse` (Android) or
    // a simulator loopback. Android's emulator reaches the host via 10.0.2.2.
    if (Platform.OS === "android") {
      return `http://10.0.2.2:${BACKEND_PORT}`;
    }
  }

  return `http://localhost:${BACKEND_PORT}`;
};

const BACKEND_URL = getBackendUrl();
const API_URL = BACKEND_URL + "/api/v1";

/**
 * Exported so uploads resolve the host the same way every other request does.
 * A second copy of this logic elsewhere is how one screen ends up talking to
 * localhost while the rest of the app talks to production.
 */
export { BACKEND_URL, API_URL };

if (__DEV__) {
  console.log("🔧 API Configuration:");
  console.log("Platform:", Platform.OS);
  console.log("Backend URL:", BACKEND_URL);
  console.log("API URL:", API_URL);
}

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

    // Dev only, and deliberately so. `config.headers` carries the bearer token
    // and `config.data` carries whatever the user just typed - phone numbers,
    // birth dates, the lot. In a release build that all lands in logcat, which
    // any other app holding READ_LOGS, or anyone with adb, can read back. The
    // __DEV__ guard also lets the minifier drop the whole block, so release
    // builds skip serializing every payload twice.
    if (__DEV__) {
      console.log("📤 API Request:");
      console.log("Method:", config.method?.toUpperCase());
      console.log("URL:", config.url);
      console.log("Base URL:", config.baseURL);
      console.log("Full URL:", `${config.baseURL}${config.url}`);
      console.log("Headers:", config.headers);
      if (config.data) {
        console.log("Data:", config.data);
      }
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
    // Same reasoning as the request interceptor: response bodies are other
    // members' profiles. Errors below stay logged in release - they are the
    // only trail for diagnosing a failure, and carry status and URL, not data.
    if (__DEV__) {
      console.log("✅ API Response:");
      console.log("Status:", response.status);
      console.log("URL:", response.config.url);
      console.log("Data:", response.data);
    }
    return response;
  },
  (error) => {
    // One line per failure. Dumping the whole axios error object buried real
    // problems under hundreds of lines of request/response internals.
    const status = error.response?.status ?? "no response";
    const url = error.config?.url ?? "?";
    const body = error.response?.data;
    console.error(
      `❌ API ${error.config?.method?.toUpperCase() ?? ""} ${url} → ${status}`,
      typeof body === "string" ? body : JSON.stringify(body ?? error.message),
    );

    if (isExpiredSession(error)) onSessionExpired();

    return Promise.reject(error);
  },
);

/**
 * True when this failure means "your token is no longer good", as opposed to
 * "you may not do that".
 *
 * The distinction matters because both arrive as 403. Spring Security answers
 * an expired JWT with 403 and a body naming the expiry; it also answers a
 * genuine authorisation failure with 403. Logging someone out for the second
 * kind would boot them mid-session for tapping something they cannot do, so the
 * body is checked rather than the status alone. 401 needs no such check - the
 * backend only issues it for authentication.
 */
function isExpiredSession(error: any): boolean {
  const status = error?.response?.status;
  if (status !== 401 && status !== 403) return false;
  if (status === 401) return true;

  const body = error.response?.data;
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  return /jwt expired|token has expired|expiredjwt/i.test(text);
}

/**
 * Drop the dead session and send the user back to sign in.
 *
 * Without this an expired token - which happens to everyone every 24h, since
 * security.jwt.expiration-time is 86400000 - left the app sitting on a screen
 * where every request had failed: empty lists, "Failed to load" everywhere, and
 * no hint that signing in again was the fix. Users cannot be expected to work
 * that out.
 *
 * Guarded because a single screen fires several requests at once, and a burst
 * of expired responses would otherwise queue up a redirect each.
 */
let redirecting = false;

async function onSessionExpired(): Promise<void> {
  if (redirecting) return;
  redirecting = true;

  try {
    await AsyncStorage.multiRemove(["auth_token", "token_expiry"]);
  } catch {
    // Storage failing here must not swallow the redirect - a user stuck on a
    // broken screen is worse than a stale key.
  }

  // router.replace, not push: the dead session must not be reachable with Back.
  router.replace("/login");

  // Cleared on the next tick rather than never, so a later expiry in the same
  // app run still redirects.
  setTimeout(() => {
    redirecting = false;
  }, 1000);
}

/**
 * True when a like/connect failed only because it already exists.
 *
 * The backend answers a duplicate like with 400 "You have already liked this
 * profile." From the user's point of view the desired state is already true, so
 * callers should treat this as success rather than surfacing an error and
 * rolling back the button.
 */
export const isAlreadyLiked = (error: any): boolean => {
  if (error?.response?.status !== 400) return false;
  const body = error.response?.data;
  const text =
    typeof body === "string" ? body : (body?.message ?? body?.detail ?? "");
  return /already/i.test(String(text));
};

export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    mobileNo?: string;
  }) => api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  // Sends Google's signed ID token; the backend verifies it and returns our own
  // JWT. Identity fields are intentionally not sent - the server derives them
  // from the verified token so they cannot be spoofed by the client.
  googleAuth: (data: { idToken: string }) => api.post("/auth/google", data),
};

export const profileAPI = {
  getMe: () => api.get("/user"),
  updateProfile: (data: any) => api.patch("/user/profile", data),
  createProfile: (data: any) => api.post("/user/profile", data),
  /**
   * @param oppositeGender true for the browse feed, which shows only the gender
   *   you are looking for. "See all profiles" leaves it false on purpose - that
   *   screen is meant to list every member.
   *
   *   Profiles with no gender recorded come back either way, because most rows
   *   in the database still have none and excluding them empties the feed.
   */
  getProfiles: (page = 0, size = 20, oppositeGender = false) =>
    api.get(`/users?page=${page}&size=${size}&oppositeGender=${oppositeGender}`),
  getProfile: (id: string | number) => api.get(`/users/${id}`),

  /**
   * Hide or unhide your own profile. Reversible - the account, photos and
   * connections all stay intact while hidden.
   */
  setHidden: (hidden: boolean) => api.patch("/user/profile/visibility", { hidden }),

  /**
   * Delete your own profile. Soft delete server-side, but from the member's
   * point of view it is gone and they are signed out.
   */
  deleteAccount: () => api.delete("/user/profile"),

  /**
   * Generate your birth chart.
   *
   * Sends no body on purpose. The server reads date, time and place of birth
   * from your own profile, so there is nothing here to point at someone else -
   * and nothing the client can put in that is not already on your record.
   *
   * Slower than most calls: it invokes a Lambda, which cold-starts.
   */
  generateKundali: () => api.post("/user/kundali", undefined, { timeout: 30000 }),

  /** Your stored chart, generated on first ask and cached after that. */
  getKundali: () => api.get("/user/kundali", { timeout: 30000 }),

  /**
   * Ashtakoota score against another member, with both charts.
   *
   * One call rather than two: the screen wants the score and their chart at
   * the same moment, and either may need generating first.
   */
  matchKundali: (id: string | number) =>
    api.get(`/user/kundali/match/${id}`, { timeout: 40000 }),

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
  updateEducationInfo: (data: any) =>
    api.patch("/user/profile/education", data),
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
  getProfileViews: (page = 0, size = 10) =>
    api.get(`/views?page=${page}&size=${size}`),
  // Backend accepts either `profileId` or `viewedId` for the viewed profile.
  addView: (
    data: { viewedId: number | string } | { profileId: number | string },
  ) => api.post("/views", data),
};

export const referenceAPI = {
  /** Every dropdown list in one call - the profile form needs a dozen at once. */
  allOptions: () => api.get("/reference/options"),
  options: (category: string) => api.get(`/reference/options/${category}`),
  states: () => api.get("/reference/states"),
  cities: (params: { stateId?: number; stateCode?: string; search?: string }) =>
    api.get("/reference/cities", { params }),
};

export const notificationAPI = {
  /** Send the device's FCM token so the backend can push to it. */
  registerToken: (data: { token: string; platform: string }) =>
    api.post("/notifications/token", data),
  /** Called on logout so the next account here does not inherit these pushes. */
  unregisterToken: (data: { token: string }) =>
    api.delete("/notifications/token", { data }),
  list: (page = 0, size = 20) =>
    api.get(`/notifications?page=${page}&size=${size}`),
  unreadCount: () => api.get("/notifications/unread-count"),
  markAllRead: () => api.post("/notifications/read-all"),
};

export const attachmentAPI = {
  generateUploadUrl: (fileType: string, originalFileName: string) =>
    api.get(
      `/attachment/generate-upload-url?fileType=${encodeURIComponent(fileType)}&originalFileName=${encodeURIComponent(originalFileName)}`,
    ),
  uploadFile: async (formData: FormData) => {
    const token = await AsyncStorage.getItem("auth_token");
    const response = await fetch(`${API_URL}/attachment/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // Do NOT set Content-Type here, let fetch generate it with the boundary!
      },
    });
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    return response.text();
  },
  setPrimaryImage: (id: number) => api.put(`/attachment/${id}/set-primary`),

  /**
   * Delete one of your own photos.
   *
   * Returns { newPrimaryId } when deleting the primary promoted another, so
   * the screen can reflect the new main photo without refetching everything.
   */
  deleteImage: (id: number) => api.delete(`/attachment/${id}`),
};

export default api;
