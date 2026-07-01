require("dotenv").config();
const app=require("./src/app")
const ConnectToDB=require("./src/db/db")

ConnectToDB()

app.listen(3003,()=>{
    console.log("Server is Running on port 3003")
})
