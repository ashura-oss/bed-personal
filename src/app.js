import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { client } from "./db/client.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import adventureRoutes from "./routes/adventureRoutes.js";
import abilityRoutes from "./routes/abilityRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import questRoutes from "./routes/questRoutes.js";
import regionRoutes from "./routes/regionRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const frontendPath = path.resolve(currentDir, "..", "frontend");

app.use(express.json());
app.use(express.static(frontendPath));

app.get("/health", async (_req, res, next) => {
  try {
    await client.execute("SELECT 1");

    res.status(200).json({
      status: "ok",
      project: "Realmforge: Shards of the Worldheart",
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/characters", characterRoutes);
app.use("/regions", regionRoutes);
app.use("/quests", questRoutes);
app.use("/adventures", adventureRoutes);
app.use("/abilities", abilityRoutes);
app.use("/combos", comboRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
