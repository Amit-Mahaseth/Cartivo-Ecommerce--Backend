const express=require("express")
const router=express()
const CreateAuthMiddleware=require("../middlewares/auth.middlewares")

const PaymentController=require("../controllers/payment.controller")

router.post("/verify",CreateAuthMiddleware(["user"]),PaymentController.VerifyPayment)
router.post("/:id",CreateAuthMiddleware(["user"]),PaymentController.CreatePayment)
module.exports=router