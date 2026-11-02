import { demoThreadResponse } from '../mocks/demoThreads';
import { demoClaimResponse, isDemoClaimPath } from '../mocks/demoClaims';

// The API now lives in the accounts engine under /fc (see FROZEN.md). Production builds set
// VITE_API_BASE_URL; the fallback keeps a build that forgot it pointed at the engine instead of
// at the static site itself, which would answer every /api call with index.html. In dev the
// base stays empty so /api goes through the Vite proxy (vite.config.ts).
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? 'https://accounts-api.empowered.vote/fc' : '');

// Dev-only, opt-in synthetic threads (see src/mocks/demoThreads.ts).
const DEMO_THREADS = import.meta.env.DEV && import.meta.env.VITE_DEMO_THREADS === '1';

// Dev-only, opt-in synthetic argument tree (see src/mocks/demoClaims.ts). The
// claims API is built but not deployed, so these routes 404 against the live
// API; this is the same opt-in escape hatch as DEMO_THREADS, not a licence to
// invent data anywhere else. Unreachable in a production build.
const DEMO_CLAIMS = import.meta.env.DEV && import.meta.env.VITE_DEMO_CLAIMS === '1';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; reason?: string; code?: string };

/**
 * The fields an error body can contribute. `error` is always a string, because
 * every caller treats it as one — `new Error(res.error)` appears in a dozen
 * hooks — and because one of the envelopes below would otherwise put an object
 * there.
 */
interface ErrorFields {
  error: string;
  reason?: string;
  code?: string;
}

/**
 * Reads whichever error envelope came back.
 *
 * Three shapes are on the wire and all three are real:
 *
 *   { error: 'Connected account required', reason: 'tier' }   tierGuards, engine auth
 *   { error: { code: 'CLAIM_NOT_FOUND', message: '...' } }    every claims route
 *   { reason: 'rate_limited' }                                the rate limiter
 *
 * The coded form is the one that matters here: the claims routes emit ~30
 * distinct codes, and several pairs share a status on purpose —
 * CLAIM_NOT_FOUND and ANCESTOR_NOT_VISIBLE are both 404, and the write route
 * takes real care to keep them apart. Without the code a client cannot.
 *
 * Nothing here may throw. Not every endpoint in this app answers in either
 * envelope, and a proxy returning an HTML error page is a failure to describe,
 * not a failure to report — so anything unrecognised leaves `fallback` standing.
 */
async function readErrorBody(response: Response, fallback: string): Promise<ErrorFields> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { error: fallback };
  }
  if (body === null || typeof body !== 'object') return { error: fallback };
  const { error, reason } = body as { error?: unknown; reason?: unknown };
  const fields: ErrorFields = { error: fallback };
  if (typeof error === 'string') {
    fields.error = error;
  } else if (error !== null && typeof error === 'object') {
    const { code, message } = error as { code?: unknown; message?: unknown };
    if (typeof message === 'string') fields.error = message;
    if (typeof code === 'string') fields.code = code;
  }
  if (typeof reason === 'string') fields.reason = reason;
  return fields;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  if (DEMO_THREADS) {
    const method = (options?.method ?? 'GET').toUpperCase();
    if (method !== 'GET') {
      return { ok: false, error: 'Demo threads: writes are off', status: 0 };
    }
    const demo = demoThreadResponse(path);
    if (demo === null) return { ok: false, error: 'Not found', status: 404 };
    if (demo !== undefined) return { ok: true, data: demo as T };
  }
  if (DEMO_CLAIMS && isDemoClaimPath(path)) {
    // Writes are off, and only on the claim routes: the thread and community
    // routes are live and must keep working while the demo tree is on.
    const method = (options?.method ?? 'GET').toUpperCase();
    if (method !== 'GET') {
      return { ok: false, error: 'Demo claims: writes are off', status: 0 };
    }
    const demo = demoClaimResponse(path);
    if (demo === null) return { ok: false, error: 'Not found', status: 404 };
    if (demo !== undefined) return { ok: true, data: demo as T };
  }
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
  if (!response.ok) {
    // 403 keeps its own fallback: a refusal with a body this function cannot
    // read still says more as "Forbidden" than as a status line.
    const fallback =
      response.status === 403 ? 'Forbidden' : `Request failed (${response.status})`;
    return { ok: false, status: response.status, ...(await readErrorBody(response, fallback)) };
  }
  const data: T = await response.json();
  return { ok: true, data };
}
