import "dotenv/config";
import app from "./app.js";
import { client, databaseUrl } from "./db/client.js";

const port = Number(process.env.PORT) || 3000;

try {
  await client.execute("PRAGMA foreign_keys = ON");

  app.listen(port, () => {
    console.log(`Realmforge API listening on http://localhost:${port}`);
    console.log(`Database: ${databaseUrl}`);
  });
} catch (error) {
  console.error("Failed to start Realmforge API.");
  console.error(error);
  process.exit(1);
}
