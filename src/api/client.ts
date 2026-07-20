import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const API_BASE_URL = "http://127.0.0.1:8000/api";

export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Ensure we have the latest session
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  
  // Set default content type to JSON if not provided and not sending FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = "An error occurred";
      let errorData;
      try {
        errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        // We could theoretically redirect or sign out here
      } else if (response.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (response.status === 404) {
        toast.error("Resource not found.");
      } else if (response.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (response.status >= 500) {
        toast.error(`Server error: ${errorMessage}`);
      } else {
        toast.error(errorMessage);
      }

      throw new APIError(errorMessage, response.status, errorData);
    }

    // Return null for 204 No Content
    if (response.status === 204) return null;

    // Parse JSON
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Network errors (e.g., backend is down)
    toast.error("Network error. Is the backend running?");
    throw new APIError("Network error", 0);
  }
}
