const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; reason?: string };

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  const token = localStorage.getItem('ev_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    return { ok: false, error: 'Network error', status: 0 };
  }
  if (response.status === 401) {
    window.open(
      `https://accounts.empowered.vote/login?redirect=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
    return { ok: false, error: 'Session expired - sign in to continue', status: 401 };
  }
  if (response.status === 403) {
    let body: { error?: string; reason?: string } = {};
    try {
      body = await response.json();
    } catch {
      // ignore parse errors
    }
    return { ok: false, error: body.error ?? 'Forbidden', status: 403, reason: body.reason };
  }
  if (!response.ok) {
    return { ok: false, error: `Request failed (${response.status})`, status: response.status };
  }
  const data: T = await response.json();
  return { ok: true, data };
}
