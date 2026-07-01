const express=require("express")
const OrderController= require("../controllers/order.controller")
const CreateAuthMiddleware=require("../middlewares/auth.middlewares")
const ValidationMiddleware=require("../middlewares/validation.middleware")
const router=express.Router()

router.post("/",CreateAuthMiddleware(["user"]),ValidationMiddleware.CreateOrderValidationRule,OrderController.CreateOrder)
router.get("/me",CreateAuthMiddleware(["user"]),OrderController.getMyOrders)
router.get("/:id",CreateAuthMiddleware(["admin","user"]),OrderController.getOrderById)
router.post("/:id",CreateAuthMiddleware(["admin","user"]),OrderController.getOrderById)
router.patch("/:id/cancel",CreateAuthMiddleware(["user"]),OrderController.cancelOrder)
router.patch("/:id/address",CreateAuthMiddleware(["user"]),ValidationMiddleware.UpdateAddressValidationRule,OrderController.UpdateAddress)
module.exports=router