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
}

export interface MunicipalRate {
  id: string;
  tier: number;
  maxKWh: number;
  ratePerKWh: number;
}

export interface MonthData {
  month: string;
  year: number;
  totalKWh: number;
  avgPerDay: number;
  days: number;
  entries: DailyEntry[];
}

export interface BillingData {
  startDate: string;
  endDate: string;
  totalKWh: number;
  days: number;
  avgPerDay: number;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthName(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export function calculateMonthlyData(entries: DailyEntry[]): Map<string, MonthData> {
  const monthMap = new Map<string, MonthData>();

  entries.forEach((entry) => {
    const date = parseDate(entry.date);
    const monthKey = getMonthKey(date);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        year: date.getFullYear(),
        totalKWh: 0,
        avgPerDay: 0,
        days: 0,
        entries: [],
      });
    }

    const monthData = monthMap.get(monthKey)!;
    monthData.entries.push(entry);
    monthData.totalKWh += entry.kWh;
    monthData.days = new Set(monthData.entries.map((e) => parseDate(e.date).getDate())).size;
    monthData.avgPerDay = monthData.totalKWh / monthData.days;
  });

  return monthMap;
}

export function calculateBillingData(
  entries: DailyEntry[],
  startDate: string,
  endDate: string
): BillingData {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const billingEntries = entries.filter((entry) => {
    const entryDate = parseDate(entry.date);
    return entryDate >= start && entryDate <= end;
  });

  const totalKWh = billingEntries.reduce((sum, entry) => sum + entry.kWh, 0);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const avgPerDay = days > 0 ? totalKWh / days : 0;

  return {
    startDate,
    endDate,
    totalKWh,
    days,
    avgPerDay,
  };
}

export function getDaysSince(dateStr: string): number {
  const date = parseDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function getMonthDays(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export interface TierBreakdown {
  tier1KWh: number;
  tier1Cost: number;
  tier2KWh: number;
  tier2Cost: number;
  totalCost: number;
}

export function calculateTierBreakdown(
  solarKWh: number,
  municipalRates: MunicipalRate[]
): TierBreakdown {
  const sortedRates = [...municipalRates].sort((a, b) => a.tier - b.tier);

  // Get Tier 1 and Tier 2 rates
  const tier1 = sortedRates.find((r) => r.tier === 1);
  const tier2 = sortedRates.find((r) => r.tier === 2);

  const TIER1_THRESHOLD = 350;

  if (!tier1) {
    return {
      tier1KWh: 0,
      tier1Cost: 0,
      tier2KWh: 0,
      tier2Cost: 0,
      totalCost: 0,
    };
  }

  const tier1KWh = Math.min(solarKWh, TIER1_THRESHOLD);
  const tier1Cost = tier1KWh * tier1.ratePerKWh;

  let tier2KWh = 0;
  let tier2Cost = 0;

  if (solarKWh > TIER1_THRESHOLD && tier2) {
    tier2KWh = solarKWh - TIER1_THRESHOLD;
    tier2Cost = tier2KWh * tier2.ratePerKWh;
  }

  return {
    tier1KWh,
    tier1Cost,
    tier2KWh,
    tier2Cost,
    totalCost: tier1Cost + tier2Cost,
  };
}

export function calculateSavings(
  solarKWh: number,
  municipalRates: MunicipalRate[]
): number {
  const breakdown = calculateTierBreakdown(solarKWh, municipalRates);
  return breakdown.totalCost;
}
