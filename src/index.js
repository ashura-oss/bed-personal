import express from "express";
import cors from "cors";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import adventureRoutes from "./routes/progression_routes/adventureRoutes.js";
import abilityRoutes from "./routes/content_routes/abilityRoutes.js";
import armyEncounterRoutes from "./routes/combat_routes/armyEncounterRoutes.js";
import characterRoutes from "./routes/core_routes/characterRoutes.js";
import armyRoutes from "./routes/combat_routes/armyRoutes.js";
import combatRoutes from "./routes/combat_routes/combatRoutes.js";
import dialogueRoutes from "./routes/content_routes/dialogueRoutes.js";
import enemyRoutes from "./routes/content_routes/enemyRoutes.js";
import factionRoutes from "./routes/content_routes/factionRoutes.js";
import itemRoutes from "./routes/content_routes/itemRoutes.js";
import mapRoutes from "./routes/map_routes/mapRoutes.js";
import progressionRoutes from "./routes/progression_routes/progressionRoutes.js";
import questRoutes from "./routes/content_routes/questRoutes.js";
import regionRoutes from "./routes/content_routes/regionRoutes.js";
import stateRoutes from "./routes/state_routes/stateRoutes.js";
import userRoutes from "./routes/core_routes/userRoutes.js";

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
app.use(errorHandler);

export default app;
