const express=require("express");
const cookieParser=require("cookie-parser");
const CartRoutes=require("./routes/cart.routes")
const app=express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/cart",CartRoutes);

module.exports=app;