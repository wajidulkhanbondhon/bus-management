import { LoginInput, LoginSchema, PassengerPinInput, PassengerPinSchema } from "./validations/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface UserSession {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  role: string;
  tenant_id?: string;
}

/**
 * Enterprise Secure Auth Client (Better Auth pattern with HttpOnly cookies & Zod)
 */
export const authClient = {
  /**
   * Performs credential login, validating inputs with Zod,
   * and receiving HttpOnly authentication cookies from the server.
   */
  async login(input: LoginInput) {
    const validated = LoginSchema.parse(input);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Automatically send & receive HttpOnly cookies
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Invalid credentials");
    }

    const data = await res.json();
    return data;
  },

  /**
   * Logs out the user and instructs the backend to invalidate the HttpOnly cookie.
   */
  async logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  },

  /**
   * Fetches the currently authenticated user from HttpOnly cookie session.
   */
  async getSession(): Promise<UserSession | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Passenger PIN verification with Zod validation and HttpOnly cookie.
   */
  async passengerLogin(input: PassengerPinInput) {
    const validated = PassengerPinSchema.parse(input);

    const res = await fetch(`${API_BASE}/auth/passenger-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Verification failed" }));
      throw new Error(error.detail || "Invalid PIN or phone number");
    }

    return await res.json();
  },

  /**
   * Passenger PIN setup / registration.
   */
  async passengerRegister(input: PassengerPinInput) {
    const validated = PassengerPinSchema.parse(input);

    const res = await fetch(`${API_BASE}/auth/passenger-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(error.detail || "Registration failed");
    }

    return await res.json();
  }
};
