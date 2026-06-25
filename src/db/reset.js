import "dotenv/config";
import { rm } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL || "file:dawn-of-man.db";

if (databaseUrl.startsWith("file:")) {
  const databasePath = databaseUrl.slice("file:".length) || "dawn-of-man.db";
  const absoluteDatabasePath = path.resolve(databasePath);

  for (const suffix of ["", "-shm", "-wal"]) {
    await rm(`${absoluteDatabasePath}${suffix}`, { force: true });
  }

  console.log(`Removed local database: ${absoluteDatabasePath}`);
}
