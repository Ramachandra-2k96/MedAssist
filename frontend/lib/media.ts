import { MEDIA_BASE_URL } from './config'

/**
 * Build a proper absolute media URL from varied backend representations.
 * Backend (DRF) returns file fields as absolute path starting with /media/.
 * We may also manually store relative names (audio/..., records/...).
 * This helper normalises everything to a single absolute URL.
 */
export function buildMediaUrl(path?: string | null): string {
  if (!path) return ''
  // Already full URL
  if (/^https?:/i.test(path)) return path

  const baseNoMedia = MEDIA_BASE_URL.replace(/\/media\/?$/, '')

  // Common cases
  if (path.startsWith('/media/')) return baseNoMedia + path // e.g. /media/audio/x.webm
  if (path.startsWith('media/')) return baseNoMedia + '/' + path // e.g. media/audio/x.webm

  // If path starts with /audio/ or /records/ assume missing /media prefix
  if (path.startsWith('/audio/') || path.startsWith('/records/')) return baseNoMedia + '/media' + path

  // Plain relative like audio/xyz.webm or records/abc.pdf
  return MEDIA_BASE_URL.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
}
