import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path : "./.env"
})

const PORT = process.env.PORT || 3000
console.log(PORT)
connectDB()
.then(()=> app.listen(PORT, ()=> {
    console.log("working")
    console.log(`Server is listenting on PORT: ${PORT}`)
}))
.catch((err)=>{console.log("mongodb connection error", err)})