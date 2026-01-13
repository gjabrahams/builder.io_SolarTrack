import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getAllData,
  saveAllData,
  getEntries,
  upsertEntry,
  deleteEntry,
  getBillingCycles,
  upsertBillingCycle,
  deleteBillingCycle,
  getMunicipalRates,
  upsertMunicipalRate,
  deleteMunicipalRate,
} from "./routes/solar";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Solar tracking data API routes
  // All data endpoints (for initial load and bulk save)
  app.get("/api/solar/data", getAllData);
  app.post("/api/solar/data", saveAllData);

  // Daily entries endpoints
  app.get("/api/solar/entries", getEntries);
  app.post("/api/solar/entries", upsertEntry);
  app.delete("/api/solar/entries/:date", deleteEntry);

  // Billing cycles endpoints
  app.get("/api/solar/cycles", getBillingCycles);
  app.post("/api/solar/cycles", upsertBillingCycle);
  app.delete("/api/solar/cycles/:id", deleteBillingCycle);

  // Municipal rates endpoints
  app.get("/api/solar/rates", getMunicipalRates);
  app.post("/api/solar/rates", upsertMunicipalRate);
  app.delete("/api/solar/rates/:id", deleteMunicipalRate);

  return app;
}
