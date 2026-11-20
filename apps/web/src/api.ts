export type ApiRole = 'DEFECTOLOGIST' | 'SUBJECT_TEACHER' | 'PSYCHOLOGIST' | 'SOCIAL_PEDAGOG' | 'ADMINISTRATOR';
export type ApiUser = { id: string; institutionId: string; displayName: string; roles: ApiRole[] };

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getCurrentUser() {
  return apiRequest<ApiUser>('/auth/me');
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
