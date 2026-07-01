require("dotenv").config();
const app=require("./src/app")
const ConnectToDB=require("./src/db/db")

ConnectToDB()

app.listen(3004,()=>{
    console.log("Server is Running on port 3004")
})
