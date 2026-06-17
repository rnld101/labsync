import { getToken } from "@/lib/auth";

const APPOINTMENT_API = import.meta.env.VITE_APPOINTMENT_API ?? "http://localhost:8001";
const REPORT_API = import.meta.env.VITE_REPORT_API ?? "http://localhost:8002";

export interface LabTest {
  test_id: string;
  name: string;
  description: string;
  base_cost: number | string;
  is_active: boolean;
}

export interface ChatResponse {
  answer: string;
  disclaimer: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

export const api = {
  listLabTests: () => request<LabTest[]>(`${APPOINTMENT_API}/api/v1/lab-tests`),
  chatWithReport: (reportId: string, question: string) =>
    request<ChatResponse>(`${REPORT_API}/api/v1/reports/${reportId}/chat`, {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};
