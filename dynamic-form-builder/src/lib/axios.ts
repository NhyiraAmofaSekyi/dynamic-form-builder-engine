import axios from 'axios'
import { getToken, clearToken } from '#/lib/auth'

// One configured axios instance for the whole app. Everything else imports
// THIS, never axios directly — so base URL, headers, and interceptors live
// in exactly one place.
export const apiClient = axios.create({
  // Vite env var; falls back to local backend. Set VITE_API_BASE_URL in .env.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  // backend CORS has AllowCredentials: true, so send cookies/credentials
  withCredentials: true,
})

// REQUEST: read the JWT from localStorage and attach it as a Bearer header on
// every outgoing request. Reading per-request (not once at load) means a token
// saved AFTER the client was created is still picked up.
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE: a 401 means the token is missing/expired/invalid — clear it so the
// app treats the user as logged out. Redirect is left to the _protected guard;
// we only manage token state here, then re-reject so callers' catch blocks run.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken()
    }
    return Promise.reject(error)
  },
)

// ===========================================================================
// Error normalisation
// ===========================================================================

// Mirror of the backend's response.ErrorResponse (Go):
//   { message: string, code: number, errors?: string[] }
// `errors` is a FLAT string array (validation details), not a keyed object.
export interface ApiErrorBody {
  message: string
  code: number
  errors?: string[]
}

// ApiError is a typed error we throw so callers can branch on status/details
// instead of parsing strings. Keeps the HTTP status and the structured body.
export class ApiError extends Error {
  status: number
  details: string[]

  constructor(message: string, status: number, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// handleApiError normalises ANY thrown value from an axios call into a
// consistent ApiError (or network/generic). Call it in a catch block.
//   1. no response  -> network / timeout / connection problems
//   2. has response -> use the backend's { message, errors } shape
export function handleApiError(error: unknown, unauthorizedMessage?: string): never {
  if (axios.isAxiosError(error)) {
    // ---- 1. no response: the request never reached the server ----
    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new ApiError('No internet connection. Please check your network and try again.', 0)
      }
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timed out. Please try again.', 0)
      }
      throw new ApiError('Unable to connect to the server. Please check your connection.', 0)
    }

    // ---- 2. server responded with an error ----
    const status = error.response.status
    const body = error.response.data as ApiErrorBody | undefined

    if (status === 401) {
      throw new ApiError(
        unauthorizedMessage || body?.message || 'You are not authorized to perform this action',
        401,
        body?.errors ?? [],
      )
    }

    // Prefer a specific validation detail if present, else the top-level message.
    const detail = body?.errors?.[0]
    const message = detail || body?.message || 'Something went wrong. Please try again.'
    throw new ApiError(message, status, body?.errors ?? [])
  }

  // Not an axios error (programmer error, thrown string, etc.)
  throw new ApiError('Something went wrong. Please try again.', 0)
}