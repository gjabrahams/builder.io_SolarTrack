import { RequestHandler } from "express";
import { neon } from "@netlify/neon";
import type {
  DailyEntry,
  BillingCycle,
  MunicipalRate,
  ApiResponse,
  AllDataResponse,
} from "../../shared/api";

// Get all data (entries, billing cycles, and rates)
export const getAllData: RequestHandler = async (_req, res) => {
  try {
    const sql = neon();

    const [entriesResult, cyclesResult, ratesResult] = await Promise.all([
      sql(`SELECT date, kwh FROM daily_entries ORDER BY date ASC`),
      sql(`SELECT id, month, start_date, end_date, actual_grid_kwh, applied_rate_id FROM billing_cycles ORDER BY start_date DESC`),
      sql(`SELECT id, tier, max_kwh, rate_per_kwh, start_date, end_date FROM municipal_rates ORDER BY start_date DESC, tier ASC`),
    ]);

    const entries: DailyEntry[] = entriesResult.map((row: any) => ({
      date: row.date.toISOString().split("T")[0],
      kWh: parseFloat(row.kwh),
    }));

    const billingCycles: BillingCycle[] = cyclesResult.map((row: any) => ({
      id: row.id,
      month: row.month,
      startDate: row.start_date.toISOString().split("T")[0],
      endDate: row.end_date.toISOString().split("T")[0],
      actualGridKWh: row.actual_grid_kwh ? parseFloat(row.actual_grid_kwh) : undefined,
      appliedRateId: row.applied_rate_id || undefined,
    }));

    const municipalRates: MunicipalRate[] = ratesResult.map((row: any) => ({
      id: row.id,
      tier: row.tier,
      maxKWh: parseFloat(row.max_kwh),
      ratePerKWh: parseFloat(row.rate_per_kwh),
      startDate: row.start_date.toISOString().split("T")[0],
      endDate: row.end_date ? row.end_date.toISOString().split("T")[0] : undefined,
    }));

    const response: ApiResponse<AllDataResponse> = {
      success: true,
      data: { entries, billingCycles, municipalRates },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching all data:", error);
    const response: ApiResponse<AllDataResponse> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch data",
    };
    res.status(500).json(response);
  }
};

// Save all data (replace all entries, billing cycles, and rates)
export const saveAllData: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const { entries, billingCycles, municipalRates } = req.body as AllDataResponse;

    // Clear existing data and insert new data
    await sql(`DELETE FROM daily_entries`);
    await sql(`DELETE FROM billing_cycles`);
    await sql(`DELETE FROM municipal_rates`);

    // Insert entries
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        await sql(
          `INSERT INTO daily_entries (date, kwh) VALUES ($1, $2)`,
          [entry.date, entry.kWh]
        );
      }
    }

    // Insert billing cycles
    if (billingCycles && billingCycles.length > 0) {
      for (const cycle of billingCycles) {
        await sql(
          `INSERT INTO billing_cycles (id, month, start_date, end_date, actual_grid_kwh, applied_rate_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [cycle.id, cycle.month, cycle.startDate, cycle.endDate, cycle.actualGridKWh || null, cycle.appliedRateId || null]
        );
      }
    }

    // Insert municipal rates
    if (municipalRates && municipalRates.length > 0) {
      for (const rate of municipalRates) {
        await sql(
          `INSERT INTO municipal_rates (id, tier, max_kwh, rate_per_kwh, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [rate.id, rate.tier, rate.maxKWh, rate.ratePerKWh, rate.startDate, rate.endDate || null]
        );
      }
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "All data saved successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error saving all data:", error);
    const response: ApiResponse<{ message: string }> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save data",
    };
    res.status(500).json(response);
  }
};

// Daily Entries CRUD
export const getEntries: RequestHandler = async (_req, res) => {
  try {
    const sql = neon();
    const result = await sql(`SELECT date, kwh FROM daily_entries ORDER BY date ASC`);

    const entries: DailyEntry[] = result.map((row: any) => ({
      date: row.date.toISOString().split("T")[0],
      kWh: parseFloat(row.kwh),
    }));

    const response: ApiResponse<DailyEntry[]> = { success: true, data: entries };
    res.json(response);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ success: false, error: "Failed to fetch entries" });
  }
};

export const upsertEntry: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const { date, kWh } = req.body as DailyEntry;

    await sql(
      `INSERT INTO daily_entries (date, kwh, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (date)
       DO UPDATE SET kwh = $2, updated_at = NOW()`,
      [date, kWh]
    );

    const response: ApiResponse<DailyEntry> = { success: true, data: { date, kWh } };
    res.json(response);
  } catch (error) {
    console.error("Error upserting entry:", error);
    res.status(500).json({ success: false, error: "Failed to save entry" });
  }
};

export const deleteEntry: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const { date } = req.params;

    await sql(`DELETE FROM daily_entries WHERE date = $1`, [date]);

    const response: ApiResponse<{ deleted: string }> = { success: true, data: { deleted: date } };
    res.json(response);
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ success: false, error: "Failed to delete entry" });
  }
};

// Billing Cycles CRUD
export const getBillingCycles: RequestHandler = async (_req, res) => {
  try {
    const sql = neon();
    const result = await sql(
      `SELECT id, month, start_date, end_date, actual_grid_kwh, applied_rate_id
       FROM billing_cycles ORDER BY start_date DESC`
    );

    const cycles: BillingCycle[] = result.map((row: any) => ({
      id: row.id,
      month: row.month,
      startDate: row.start_date.toISOString().split("T")[0],
      endDate: row.end_date.toISOString().split("T")[0],
      actualGridKWh: row.actual_grid_kwh ? parseFloat(row.actual_grid_kwh) : undefined,
      appliedRateId: row.applied_rate_id || undefined,
    }));

    const response: ApiResponse<BillingCycle[]> = { success: true, data: cycles };
    res.json(response);
  } catch (error) {
    console.error("Error fetching billing cycles:", error);
    res.status(500).json({ success: false, error: "Failed to fetch billing cycles" });
  }
};

export const upsertBillingCycle: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const cycle = req.body as BillingCycle;

    await sql(
      `INSERT INTO billing_cycles (id, month, start_date, end_date, actual_grid_kwh, applied_rate_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id)
       DO UPDATE SET month = $2, start_date = $3, end_date = $4, actual_grid_kwh = $5, applied_rate_id = $6, updated_at = NOW()`,
      [cycle.id, cycle.month, cycle.startDate, cycle.endDate, cycle.actualGridKWh || null, cycle.appliedRateId || null]
    );

    const response: ApiResponse<BillingCycle> = { success: true, data: cycle };
    res.json(response);
  } catch (error) {
    console.error("Error upserting billing cycle:", error);
    res.status(500).json({ success: false, error: "Failed to save billing cycle" });
  }
};

export const deleteBillingCycle: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const { id } = req.params;

    await sql(`DELETE FROM billing_cycles WHERE id = $1`, [id]);

    const response: ApiResponse<{ deleted: string }> = { success: true, data: { deleted: id } };
    res.json(response);
  } catch (error) {
    console.error("Error deleting billing cycle:", error);
    res.status(500).json({ success: false, error: "Failed to delete billing cycle" });
  }
};

// Municipal Rates CRUD
export const getMunicipalRates: RequestHandler = async (_req, res) => {
  try {
    const sql = neon();
    const result = await sql(
      `SELECT id, tier, max_kwh, rate_per_kwh, start_date, end_date
       FROM municipal_rates ORDER BY start_date DESC, tier ASC`
    );

    const rates: MunicipalRate[] = result.map((row: any) => ({
      id: row.id,
      tier: row.tier,
      maxKWh: parseFloat(row.max_kwh),
      ratePerKWh: parseFloat(row.rate_per_kwh),
      startDate: row.start_date.toISOString().split("T")[0],
      endDate: row.end_date ? row.end_date.toISOString().split("T")[0] : undefined,
    }));

    const response: ApiResponse<MunicipalRate[]> = { success: true, data: rates };
    res.json(response);
  } catch (error) {
    console.error("Error fetching municipal rates:", error);
    res.status(500).json({ success: false, error: "Failed to fetch rates" });
  }
};

export const upsertMunicipalRate: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const rate = req.body as MunicipalRate;

    await sql(
      `INSERT INTO municipal_rates (id, tier, max_kwh, rate_per_kwh, start_date, end_date, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id)
       DO UPDATE SET tier = $2, max_kwh = $3, rate_per_kwh = $4, start_date = $5, end_date = $6, updated_at = NOW()`,
      [rate.id, rate.tier, rate.maxKWh, rate.ratePerKWh, rate.startDate, rate.endDate || null]
    );

    const response: ApiResponse<MunicipalRate> = { success: true, data: rate };
    res.json(response);
  } catch (error) {
    console.error("Error upserting municipal rate:", error);
    res.status(500).json({ success: false, error: "Failed to save rate" });
  }
};

export const deleteMunicipalRate: RequestHandler = async (req, res) => {
  try {
    const sql = neon();
    const { id } = req.params;

    await sql(`DELETE FROM municipal_rates WHERE id = $1`, [id]);

    const response: ApiResponse<{ deleted: string }> = { success: true, data: { deleted: id } };
    res.json(response);
  } catch (error) {
    console.error("Error deleting municipal rate:", error);
    res.status(500).json({ success: false, error: "Failed to delete rate" });
  }
};
