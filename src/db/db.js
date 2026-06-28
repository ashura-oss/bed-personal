// ------------------------------------------------------------
// DATABASE CONNECTION
// ------------------------------------------------------------
// Connects the backend to the libSQL database.
// Required env: DATABASE_URL
// Used by: every model file that needs to run Drizzle queries.
import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";

// Create the libSQL client from the database URL in .env.
// The same setup works for a local file database and a remote libSQL URL.
const client = createClient({
  url: process.env.DATABASE_URL
});

// Export one shared Drizzle database object for all models.
// Models import this instead of creating their own database connections.
export const db = drizzle(client, { schema });
