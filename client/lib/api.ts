import type {
  DailyEntry,
  BillingCycle,
  MunicipalRate,
  ApiResponse,
  AllDataResponse,
} from "../../shared/api";

const API_BASE = "/api/solar";

// Fetch all data at once for initial load
export async function fetchAllData(): Promise<AllDataResponse> {
  const response = await fetch(`${API_BASE}/data`);
  const result: ApiResponse<AllDataResponse> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch data");
  }
  return result.data;
}

// Save all data at once
export async function saveAllData(data: AllDataResponse): Promise<void> {
  const response = await fetch(`${API_BASE}/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<{ message: string }> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to save data");
  }
}

// Daily Entries API
export async function upsertEntry(entry: DailyEntry): Promise<void> {
  const response = await fetch(`${API_BASE}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const result: ApiResponse<DailyEntry> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to save entry");
  }
}

export async function deleteEntry(date: string): Promise<void> {
  const response = await fetch(`${API_BASE}/entries/${encodeURIComponent(date)}`, {
    method: "DELETE",
  });
  const result: ApiResponse<{ deleted: string }> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to delete entry");
  }
}

// Billing Cycles API
export async function upsertBillingCycle(cycle: BillingCycle): Promise<void> {
  const response = await fetch(`${API_BASE}/cycles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cycle),
  });
  const result: ApiResponse<BillingCycle> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to save billing cycle");
  }
}

export async function deleteBillingCycle(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/cycles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const result: ApiResponse<{ deleted: string }> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to delete billing cycle");
  }
}

// Municipal Rates API
export async function upsertMunicipalRate(rate: MunicipalRate): Promise<void> {
  const response = await fetch(`${API_BASE}/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rate),
  });
  const result: ApiResponse<MunicipalRate> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to save rate");
  }
}

export async function deleteMunicipalRate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/rates/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const result: ApiResponse<{ deleted: string }> = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to delete rate");
  }
}
