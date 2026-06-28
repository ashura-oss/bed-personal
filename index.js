// Express entry point that prepares middleware, mounts route modules, and starts the API server.
import "dotenv/config";
import express from "express";
import cors from "cors";
import abilityRoutes from "./src/routes/abilityRoutes.js";
import adventureRoutes from "./src/routes/adventureRoutes.js";
import armyRoutes from "./src/routes/armyRoutes.js";
import characterRoutes from "./src/routes/characterRoutes.js";
import combatRoutes from "./src/routes/combatRoutes.js";
import dialogueRoutes from "./src/routes/dialogueRoutes.js";
import enemyRoutes from "./src/routes/enemyRoutes.js";
import factionRoutes from "./src/routes/factionRoutes.js";
import itemRoutes from "./src/routes/itemRoutes.js";
import mapRoutes from "./src/routes/mapRoutes.js";
import progressionRoutes from "./src/routes/progressionRoutes.js";
import questRoutes from "./src/routes/questRoutes.js";
import regionRoutes from "./src/routes/regionRoutes.js";
import stateRoutes from "./src/routes/stateRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import { handleJsonParseError } from "./src/middlewares/validation.js";

const app = express();

// Global request setup runs before any route so every controller receives parsed JSON.
app.use(cors());
app.use(express.json());
app.use(handleJsonParseError);

// Route modules are grouped by resource so each file handles one area of the backend.
app.use("/users", userRoutes);
app.use("/characters", characterRoutes);
app.use("/regions", regionRoutes);
app.use("/quests", questRoutes);
app.use("/items", itemRoutes);
app.use("/enemies", enemyRoutes);
app.use("/factions", factionRoutes);
app.use("/adventures", adventureRoutes);
app.use("/abilities", abilityRoutes);
app.use("/combat", combatRoutes);
app.use("/dialogues", dialogueRoutes);
app.use("/map", mapRoutes);
app.use("/army", armyRoutes);
app.use("/progression", progressionRoutes);
app.use("/state", stateRoutes);

// Final 404 response for requests that did not match any mounted route.
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `No route found for ${req.method} ${req.originalUrl}. The requested endpoint is not defined.`
  });
});

const PORT = process.env.PORT || 3000;

// Tests import the app without opening a network port.
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Dawn of Man API on :${PORT}`));
}

export default app;
