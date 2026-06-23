import "dotenv/config";
import app from "./app.js";
import { client, databaseUrl } from "./db/client.js";

const port = Number(process.env.PORT) || 3001;

try {
  await client.execute("PRAGMA foreign_keys = ON");

  app.listen(port, () => {
    console.log(`Sauron's Conquest API listening on http://localhost:${port}`);
    console.log(`Database: ${databaseUrl}`);
  });
} catch (error) {
  console.error("Failed to start Sauron's Conquest API.");
  console.error(error);
  process.exit(1);
}
