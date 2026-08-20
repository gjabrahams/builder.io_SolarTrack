/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Solar tracking data types
 */
export interface DailyEntry {
  date: string;
  kWh: number;
}

export interface BillingCycle {
  id: string;
  month: string;
  startDate: string;
  endDate: string;
  actualGridKWh?: number;
  appliedRateId?: string;
}

export interface MunicipalRate {
  id: string;
  tier: number;
  maxKWh: number;
  ratePerKWh: number;
  startDate: string;
  endDate?: string;
}

/**
 * API response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AllDataResponse {
  entries: DailyEntry[];
  billingCycles: BillingCycle[];
  municipalRates: MunicipalRate[];
}
