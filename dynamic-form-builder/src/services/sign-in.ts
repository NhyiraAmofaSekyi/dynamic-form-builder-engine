import { setToken, clearToken } from "#/lib/auth";
import {apiClient, handleApiError} from "#/lib/axios.ts";

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

// signIn calls the backend, stores the returned JWT, and returns it. Errors are
// normalised through handleApiError so callers get a consistent ApiError
// (network/timeout/401/validation) instead of a raw axios error.
export async function signIn(req: SignInRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>(`/auth/sign-in`, req);
    setToken(data.token);
    return data;
  } catch (err) {
    handleApiError(err, "Invalid email or password"); // throws ApiError
  }
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function signUp(req: SignUpRequest): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>(`/auth/sign-up`, req);
    setToken(data.token);
    return data;
  } catch (err) {
    handleApiError(err);
  }
}

// signOut clears the stored token. (No backend call needed for stateless JWT.)
export function signOut(): void {
  clearToken();
}

