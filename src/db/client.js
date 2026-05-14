import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const databaseUrl = process.env.LIBSQL_URL || "file:realmforge.db";
const authToken = process.env.LIBSQL_AUTH_TOKEN || undefined;

const client = createClient({
  url: databaseUrl,
  authToken
});

const db = drizzle(client, { schema });

export { client, databaseUrl, db };
