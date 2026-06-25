import express from "express";
import cors from "cors";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import adventureRoutes from "./routes/progression_routes/adventureRoutes.js"
import abilitiyRoutes from "./routes/content_routes/abilitiyRoutes.js"
import armyEncountersRoutes from "./routes/combat_routes/armyEncounterRoutes.js";
import characterRoutes from "./routes/core_routes/characterRoutes.js"
import armyRoutes from "./routes/combat_routes/armyRoutes.js";
import combatRoutes from "./routes/combat_routes/combatroutes.js";
import dialougeRoutes from "./routes/content_routes/dialougeRoutes.js";
import enemyRoutes from "./routes/content_routes/enemyRoutes.js"
import factionRoutes from "./routes/content_routes/factionRoutes.js";
import itemRoutes from "./routes/content_routes/itemRoutes.js";
import mapRoutes from "./routes/content_routes/mapRoutes.js";
import progressionRoutes from "./routes/progression_routes/progressionRoutes.js";
import questRoutes from "./routes/content_routes/questRoutes.js";
import stateRoutes from "./routes/state_routes/state_routes.js";
import userRoutes from "./routes/user_routes/core_routes.js";
import regionRoutes from "./routes/content_routes/regionRoutes.jks"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/characters",characterRoutes);
app.use("/regions", regionRoutes);
app.use("/quests", questRoutes);
app.use("/items",itemRoutes);
app.use("/enemies",enemyRoutes);
app.use("/factions", factionRoutes);
app.use("/adventures", adventureRoutes);
app.use("/abilities", abilitiyRoutes);
app.use("/combat",combatRoutes);
app.use("/dialouges",dialougeRoutes);
app.use("/map",mapRoutes);
app.use("/army",armyRoutes);
app.use("/army-encounters", armyEncountersRoutes);
app.use("/progression", progressionRoutes);
app.use("/state",stateRoutes);


app.use(notFound);
app.use(errorHandler);

export default app; 