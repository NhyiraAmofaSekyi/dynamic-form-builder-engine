import { jwtDecode } from 'jwt-decode'

export const TOKEN_KEY = 'accessToken'

interface JwtPayload {
  uid: string
  role: string
  exp: number
}

// set/clear are only ever called from event handlers (sign-in, logout), which
// run in the browser — so no SSR guard is needed here.
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.clear()
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function decodeToken(): JwtPayload | null {
  const token = getToken()
  if (!token) return null
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  const decoded = decodeToken()
  if (!decoded) return false
  return decoded.exp > Date.now() / 1000 // exp is in seconds
}