// ------------------------------------------------------------
// LOCAL DATABASE RESET SCRIPT
// ------------------------------------------------------------
// Deletes the local SQLite/libSQL database files before rebuilding tables.
// Required env: DATABASE_URL should start with file:
// Used by: npm run db:reset
import "dotenv/config";
import { rm } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL || "file:dawn-of-man.db";

// Only local file databases are deleted. Remote libSQL URLs are ignored.
// This prevents the reset script from accidentally deleting remote project data.
if (databaseUrl.startsWith("file:")) {
  const databasePath = databaseUrl.slice("file:".length) || "dawn-of-man.db";
  const absoluteDatabasePath = path.resolve(databasePath);

  // SQLite can create sidecar files, so reset removes the main, shm, and wal files.
  for (const suffix of ["", "-shm", "-wal"]) {
    await rm(`${absoluteDatabasePath}${suffix}`, { force: true });
  }

  console.log(`Removed local database: ${absoluteDatabasePath}`);
}
