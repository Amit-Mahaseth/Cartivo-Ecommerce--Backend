const cookieParser = require("cookie-parser")
const express=require("express")
const PaymentRoutes=require("./routes/payment.routes")

const app=express()
app.use(cookieParser())
app.use(express.json())
app.use("/api/payment",PaymentRoutes)
module.exports=app