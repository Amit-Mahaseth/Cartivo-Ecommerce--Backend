const express=require("express")
const CartController=require("../controllers/cart.controller")
const Validator=require("../middlewares/validation.middleware")
const CreateAuthMiddleware=require("../middlewares/auth.middlewares") 
const router=express.Router();
router.post("/items",CreateAuthMiddleware(["user"]),Validator.AddCartItemValidatorRule,CartController.CreateCartItem);
router.patch("/items/:productId",CreateAuthMiddleware(["user"]),Validator.UpdateCartItemValidatorRule,CartController.UpdateCartItem);
router.get("/",CreateAuthMiddleware(["user"]),CartController.GetCart);
module.exports=router;