// Centralized API configuration for both local dev and production on Vercel
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanPath}`;
}
