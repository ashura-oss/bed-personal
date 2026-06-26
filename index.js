// Express entry point that mounts all route files and starts the API server.
import "dotenv/config";
import express from "express";
import cors from "cors";
import abilityRoutes from "./src/routes/abilityRoutes.js";
import adventureRoutes from "./src/routes/adventureRoutes.js";
import armyEncounterRoutes from "./src/routes/armyEncounterRoutes.js";
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
import { notFound } from "./src/middlewares/statusMessage.js";

const app = express();

app.use(cors());
app.use(express.json());

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
app.use("/army-encounters", armyEncounterRoutes);
app.use("/progression", progressionRoutes);
app.use("/state", stateRoutes);

app.use(notFound);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Dawn of Man API on :${PORT}`));
}

export default app;
