export type ApiRole = 'DEFECTOLOGIST' | 'SUBJECT_TEACHER' | 'PSYCHOLOGIST' | 'SOCIAL_PEDAGOG' | 'ADMINISTRATOR';
export type ApiUser = { id: string; userId?: string; institutionId: string; displayName: string; roles: ApiRole[] };

export const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiUploadFile<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<T>(path, {
    method: 'POST',
    body: formData,
  });
}

export function getLibraryFileUrl(fileId: string, download = false): string {
  return `${baseUrl}/library/files/${encodeURIComponent(fileId)}${download ? '?download=1' : ''}`;
}

export async function getCurrentUser() {
  const user = await apiRequest<ApiUser>('/auth/me');
  return { ...user, id: user.id ?? user.userId ?? '' };
}

export async function login(login: string, password: string) {
  return apiRequest<{ user: ApiUser; expiresAt: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
}

export async function logout() {
  return apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' });
}
