export function isTokenValid(token?: string | null) {
  if (!token) return false
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload && payload.exp) {
      const now = Math.floor(Date.now() / 1000)
      return payload.exp > now
    }
    return true // no exp claim -> assume valid
  } catch (e) {
    return false
  }
}

export function logoutAndRedirect(isDoctor = false) {
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  } catch {}
  if (isDoctor) window.location.href = '/doctor-login'
  else window.location.href = '/login'
}
