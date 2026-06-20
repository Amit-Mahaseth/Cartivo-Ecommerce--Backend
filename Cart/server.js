require("dotenv").config();
const app=require("./src/app");
const ConnectToDB=require("./src/db/db")
ConnectToDB()
app.listen(3002,()=>{
    console.log("Server is running on port 3002");
})