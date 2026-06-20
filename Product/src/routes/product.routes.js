const express=require("express");
const CreateAuthMiddleware=require("../middlewares/auth.middlewares");
const ProductController=require("../controller/product.controller");
const multer=require("multer");
const router=express.Router();

const upload=multer({storage:multer.memoryStorage()});

router.post("/",CreateAuthMiddleware(["admin","seller"]),upload.array("images",5),ProductController.createProduct);
router.get("/",ProductController.getProducts);
router.get("/seller",CreateAuthMiddleware(["admin","seller"]),ProductController.getSellerProducts);
router.get("/:id",ProductController.getProductById);
router.patch("/:id",CreateAuthMiddleware(["admin","seller"]),ProductController.updateProduct);
router.delete("/:id",CreateAuthMiddleware(["admin","seller"]),ProductController.deleteProduct);
module.exports=router;
