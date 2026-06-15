const express=require("express");

const router=express.Router();


router.post("/",(req,res)=>{
    res.send("Product created successfully");
})


module.exports=router;