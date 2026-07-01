const cookieParser = require("cookie-parser")
const express=require("express")
const OrderRoutes=require("./routes/order.routes")

const app=express()
app.use(cookieParser())
app.use(express.json())
app.use("/api/orders",OrderRoutes)
module.exports=app