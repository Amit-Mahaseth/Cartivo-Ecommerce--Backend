const {body,validationResult}=require("express-validator")
const mongoose=require("mongoose")
const ValdateCartItem=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    next();
}

const AddCartItemValidatorRule=[
    body("productId")
    .notEmpty().
    withMessage("Product ID is required")
    .bail()
  .custom((value)=> mongoose.Types.ObjectId.isValid(value)
  ).withMessage("Invalid Product ID")
    ,
    body("quantity")
    .isInt({gt:0})
    .withMessage("Quantity must be a positive integer"),
  ValdateCartItem
]

const UpdateCartItemValidatorRule=[
    body("quantity")
    .isInt({gt:0})
    .withMessage("Quantity must be a positive integer")
    .bail(),
  ValdateCartItem
]
module.exports={AddCartItemValidatorRule, UpdateCartItemValidatorRule}