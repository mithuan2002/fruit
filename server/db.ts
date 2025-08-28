
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection for Replit PostgreSQL
const connectionString = process.env.DATABASE_URL;

// Create postgres client with proper configuration for Replit
export const sql = postgres(connectionString, {
  ssl: 'require',  // Always require SSL for Replit PostgreSQL
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60,
});

export const db = drizzle(sql, { schema });
