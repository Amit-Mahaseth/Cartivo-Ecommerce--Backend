const express=require('express');
const AuthController=require('../controllers/auth.controller');
const Validator=require('../middlewares/auth.velidator');
const Middleware=require('../middlewares/auth.middleware');
const router=express.Router();

router.post('/register',Validator.RegiseterUserValidationRule,AuthController.register);
router.post('/login',Validator.validateLoginRule,AuthController.Login);
router.get("/me",Middleware.authMiddleware,AuthController.getCurrentUser);
router.get("/logout",AuthController.logout);
router.post("/user/me/addresses",Middleware.authMiddleware,Validator.validateAddressRule,AuthController.AddUserAddress)
router.get("/user/me/addresses",Middleware.authMiddleware,AuthController.getUserAddresses)
router.delete("/user/me/addresses/:addressId",Middleware.authMiddleware,AuthController.deleteUserAddress)
module.exports=router;