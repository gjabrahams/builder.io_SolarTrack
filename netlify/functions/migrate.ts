import { neon } from "@netlify/neon";

export const handler = async () => {
  const sql = neon();

  try {
    // Create daily_entries table
    await sql(`
      CREATE TABLE IF NOT EXISTS daily_entries (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        kwh DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create billing_cycles table
    await sql(`
      CREATE TABLE IF NOT EXISTS billing_cycles (
        id VARCHAR(50) PRIMARY KEY,
        month VARCHAR(7) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        actual_grid_kwh DECIMAL(10, 2),
        applied_rate_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create municipal_rates table
    await sql(`
      CREATE TABLE IF NOT EXISTS municipal_rates (
        id VARCHAR(50) PRIMARY KEY,
        tier INTEGER NOT NULL,
        max_kwh DECIMAL(10, 2) NOT NULL,
        rate_per_kwh DECIMAL(10, 4) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better query performance
    await sql(`
      CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date)
    `);

    await sql(`
      CREATE INDEX IF NOT EXISTS idx_billing_cycles_month ON billing_cycles(month)
    `);

    await sql(`
      CREATE INDEX IF NOT EXISTS idx_municipal_rates_start_date ON municipal_rates(start_date)
    `);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Database migration completed successfully",
      }),
    };
  } catch (error) {
    console.error("Migration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Migration failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
