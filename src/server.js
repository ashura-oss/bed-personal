import "dotenv/config";
import app from "./index.js";

const port = Number(process.env.PORT) || 3000;

app.listen(port , () =>{
    console.log(`Dawn of Man API listening on ${port}`)
})