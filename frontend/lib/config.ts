// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// MEDIA base url - when serving media from Django, MEDIA_URL is typically '/media/'
// If you're running Django on a separate host, set NEXT_PUBLIC_MEDIA_URL (e.g. http://127.0.0.1:8000/media)
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || `${API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000'}/media`;
