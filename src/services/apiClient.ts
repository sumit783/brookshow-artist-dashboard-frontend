// API Client with mock adapter pattern
// Replace mock implementations with real API calls when backend is ready

import { config } from "../config";
import {
  Artist,
  Service,
  Booking,
  CalendarBlock,
  MediaItem,
  LoginCredentials,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
  VerifyOTPPayload,
  VerifyOTPResponse,
  ProfilePayload,
} from "../types";
import {
  mockArtist,
  mockServices,
  mockBookings,
  mockCalendarBlocks,
  mockMediaItems,
} from "./mockData";

// Simulated network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Centralized fetch with headers (x_api_key and Authorization)
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const headers = new Headers(init?.headers || {});
  
  // Only set Content-Type for non-FormData requests
  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (config.apiKey) {
    headers.set("x_api_key", config.apiKey);
    headers.set("x-api-key", config.apiKey); // compatibility with hyphenated header
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn("VITE_API_KEY is not set; requests may be rejected by the API.");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const response = await fetch(url, { ...init, headers });
  // Global network issue handling
  if (response.status === 503 || (!navigator.onLine)) {
    try {
      window.dispatchEvent(new Event("network-issue"));
    } catch (_) {
      // ignore
    }
  } else {
    // Inspect body (non-blocking) for specific backend error without consuming stream
    const clone = response.clone();
    clone.text().then((text) => {
      if (text && text.includes("Network connection required")) {
        window.dispatchEvent(new Event("network-issue"));
      }
    }).catch(() => {});
  }
  return response;
}

// Mock Auth
export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    await delay(500);
    
    // Demo login - accepts any credentials
    if (credentials.email && credentials.password) {
      return {
        user: {
          id: "user-1",
          email: credentials.email,
          role: "artist",
          artistId: mockArtist.id,
        },
        token: "mock-jwt-token",
      };
    }
    
    throw new Error("Invalid credentials");
  },
  
  async register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
    // Always hit real backend for registration; ignores mock mode
    const response = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let message = "Registration failed";
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json().catch(() => null);
        message = (data && (data.message || data.error)) || message;
        // Include HTTP status for caller-side parsing/branching
        throw new Error(JSON.stringify({ message, status: response.status }));
      } else {
        const text = await response.text().catch(() => "");
        message = text || message;
        throw new Error(message);
      }
    }
    const data: RegisterResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Registration failed");
    }
    const mappedUser: AuthUser = {
      id: data.user._id,
      email: data.user.email,
      role: data.user.role === "artist" ? "artist" : "admin",
    };
    return { user: mappedUser };
  },
  
  async verifyOTP(payload: VerifyOTPPayload): Promise<{ user: AuthUser; token: string }> {
    // Verify registration OTP and get JWT token
    const response = await apiFetch("/auth/verify-registration-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "OTP verification failed");
    }
    const data: VerifyOTPResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "OTP verification failed");
    }
    const mappedUser: AuthUser = {
      id: data.user._id,
      email: data.user.email,
      role: data.user.role === "artist" ? "artist" : "admin",
    };
    return { user: mappedUser, token: data.jwtToken };
  },
  
  async logout(): Promise<void> {
    await delay(200);
    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },
  
  async getCurrentUser(): Promise<AuthUser | null> {
    await delay(200);
    const user = localStorage.getItem("auth_user");
    return user ? JSON.parse(user) : null;
  },
};

// Mock Artists API
export const artistsApi = {
  async getCategories(activeOnly: boolean = true): Promise<string[]> {
    const response = await apiFetch(`/artist/categories?activeOnly=${activeOnly ? "true" : "false"}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to load categories");
    }
    const data = await response.json();
    return Array.isArray(data?.categories) ? data.categories : [];
  },
  async getById(id: string): Promise<Artist> {
    await delay(300);
    if (id === mockArtist.id) {
      return { ...mockArtist };
    }
    throw new Error("Artist not found");
  },
  
  async update(id: string, data: Partial<Artist>): Promise<Artist> {
    await delay(500);
    return { ...mockArtist, ...data };
  },
  
  async updateProfile(payload: ProfilePayload): Promise<{ success: boolean; message: string }> {
    // Always hit real backend for profile update
    const formData = new FormData();
    
    if (payload.profileImage) {
      formData.append("profileImage", payload.profileImage);
    }
    formData.append("bio", payload.bio);
    formData.append("category", payload.category.join(",")); // Comma-separated string
    formData.append("city", payload.city);
    formData.append("state", payload.state);
    formData.append("country", payload.country);
    formData.append("eventPricing", JSON.stringify(payload.eventPricing));
    
    const response = await apiFetch("/artist/profile", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Profile update failed");
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Profile update failed");
    }
    
    return data;
  },
};

// Mock Services API
export const servicesApi = {
  async getByArtist(artistId: string): Promise<Service[]> {
    await delay(300);
    return [...mockServices];
  },
  
  async create(service: Omit<Service, "id">): Promise<Service> {
    await delay(500);
    return { ...service, id: `service-${Date.now()}` };
  },
  
  async update(id: string, data: Partial<Service>): Promise<Service> {
    await delay(500);
    const service = mockServices.find((s) => s.id === id);
    if (!service) throw new Error("Service not found");
    return { ...service, ...data };
  },
  
  async delete(id: string): Promise<void> {
    await delay(300);
    // In real app, would delete from backend
  },
};

// Mock Bookings API
export const bookingsApi = {
  async getByArtist(artistId: string): Promise<Booking[]> {
    await delay(400);
    return [...mockBookings];
  },
  
  async getById(id: string): Promise<Booking> {
    await delay(300);
    const booking = mockBookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    return { ...booking };
  },
  
  async create(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> {
    await delay(500);
    return {
      ...booking,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  async updateStatus(id: string, status: Booking["status"]): Promise<Booking> {
    await delay(400);
    const booking = mockBookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    return { ...booking, status, updatedAt: new Date().toISOString() };
  },
  
  async delete(id: string): Promise<void> {
    await delay(300);
  },
};

// Mock Calendar API
export const calendarApi = {
  async getByArtist(artistId: string): Promise<CalendarBlock[]> {
    await delay(300);
    return [...mockCalendarBlocks];
  },
  
  async create(block: Omit<CalendarBlock, "id">): Promise<CalendarBlock> {
    await delay(400);
    return { ...block, id: `block-${Date.now()}` };
  },
  
  async delete(id: string): Promise<void> {
    await delay(300);
  },
};

// Mock Media API
export const mediaApi = {
  async getByArtist(artistId: string): Promise<MediaItem[]> {
    await delay(300);
    return [...mockMediaItems];
  },
  
  async upload(artistId: string, file: File): Promise<MediaItem> {
    await delay(1000); // Simulate upload time
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `media-${Date.now()}`,
          artistId,
          type: file.type.startsWith("video") ? "video" : "image",
          url: "",
          dataUrl: reader.result as string,
          fileName: file.name,
          fileSize: file.size,
          order: 0,
          uploadedAt: new Date().toISOString(),
          syncStatus: "pending",
        });
      };
      reader.readAsDataURL(file);
    });
  },
  
  async updateOrder(artistId: string, mediaIds: string[]): Promise<void> {
    await delay(300);
  },
  
  async delete(id: string): Promise<void> {
    await delay(300);
  },
};

// Export combined API client
export const apiClient = {
  auth: authApi,
  artists: artistsApi,
  services: servicesApi,
  bookings: bookingsApi,
  calendar: calendarApi,
  media: mediaApi,
};
