// Centralized API helper to reduce repetitive fetch + auth header logic
import { API_BASE_URL } from './config'

interface RequestOptions extends RequestInit {
  auth?: boolean
  tokenOverride?: string | null
  asForm?: boolean
}

export async function apiFetch<T=any>(path: string, { auth = true, tokenOverride, asForm = false, headers: customHeaders, ...rest }: RequestOptions = {}): Promise<T> {
  const token = tokenOverride ?? (auth ? (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) : null)
  const finalHeaders: Record<string, string> = {}
  if (!asForm && !(rest.body instanceof FormData)) {
    if (!customHeaders || !(customHeaders as any)['Content-Type']) finalHeaders['Content-Type'] = 'application/json'
  }
  if (customHeaders) Object.entries(customHeaders as Record<string,string>).forEach(([k,v])=> { if (v !== undefined) finalHeaders[k] = v as any })
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const resp = await fetch(url, { ...rest, headers: finalHeaders })
  if (!resp.ok) {
    // Handle authentication errors
    if (resp.status === 401 || resp.status === 403) {
      // Clear invalid token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
      const err: any = new Error('Authentication failed. Redirecting to login.')
      err.status = resp.status
      throw err
    }

    let detail: any = null
    try { detail = await resp.json() } catch { /* ignore */ }
    const err: any = new Error(`Request failed ${resp.status}`)
    err.status = resp.status
    err.detail = detail
    throw err
  }
  try { return await resp.json() } catch { return undefined as any }
}

export function buildQuery(params: Record<string, any>): string {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k,v])=> {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach(item => s.append(k, String(item)))
    else s.append(k, String(v))
  })
  const qs = s.toString()
  return qs ? `?${qs}` : ''
}
