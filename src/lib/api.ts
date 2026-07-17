import type { ApiError, SessionPayload } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const SESSION_COOKIE = "towerpro_token";
const NO_STORE_CACHE = "no-store";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getTokenFromBrowserCookie() {
  if (typeof document === "undefined") {
    return "";
  }

  const item = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));

  return item ? decodeURIComponent(item.split("=")[1] ?? "") : "";
}

export async function parseError(response: Response) {
  let payload: ApiError | null = null;

  try {
    payload = (await response.json()) as ApiError;
  } catch {
    payload = null;
  }
  const msg = payload?.detail ?? payload?.message ?? "Request failed";
  if (typeof msg === 'object') {
    return JSON.stringify(msg);
  }
  return msg;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const token = getTokenFromBrowserCookie();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: NO_STORE_CACHE,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function fetchSession() {
  const response = await fetch(`/api/session/me?ts=${Date.now()}`, {
    cache: NO_STORE_CACHE,
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as SessionPayload;
}

export async function getPunchPoints(token: string) {
  const res = await fetch(`${API_BASE_URL}/punch-points`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getReports(token: string) {
  const res = await fetch(`${API_BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function generateFirstInspectionReport(cycleId: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/reports/inspection-cycles/${cycleId}/first-inspection`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function generatePunchPointReport(cycleId: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/reports/inspection-cycles/${cycleId}/punch-point-report`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getTenantSettings(token: string) {
  const res = await fetch(`${API_BASE_URL}/settings/tenant`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateTenantSettings(data: any, token: string) {
  const res = await fetch(`${API_BASE_URL}/settings/tenant`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function uploadTenantBranding(type: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/settings/tenant/${type}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getUserSettings(token: string) {
  const res = await fetch(`${API_BASE_URL}/settings/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateUserSettings(data: any, token: string) {
  const res = await fetch(`${API_BASE_URL}/settings/user`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function changePassword(data: any, token: string) {
  const res = await fetch(`${API_BASE_URL}/settings/change-password`, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getEngineers(token: string) {
  const res = await fetch(`${API_BASE_URL}/engineers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createEngineer(data: any, token: string) {
  const res = await fetch(`${API_BASE_URL}/engineers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
