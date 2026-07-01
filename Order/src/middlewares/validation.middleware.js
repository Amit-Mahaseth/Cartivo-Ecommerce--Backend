const {body,validationResult}=require("express-validator")
const mongoose=require("mongoose")
const ValdateOrderItem=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    next();
}
const ValidateAddress=(req,res,next)=>{
    const errors=validationResult(req); 
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    next();
}

const CreateOrderValidationRule=[
    body("shippingAddress.street")
        .notEmpty()
        .withMessage("Street is required"),
        body("shippingAddress.city")
        .notEmpty()
        .withMessage("City is required"),
        body("shippingAddress.state") 
        .notEmpty()
        .withMessage("State is required"),
        body("shippingAddress.zipCode")
        .notEmpty()
        .withMessage("Zip Code is required"),  
        body("shippingAddress.country")
        .notEmpty()
        .withMessage("Country is required")
        .bail(),
        ValdateOrderItem

]
const UpdateAddressValidationRule=[
    body("shippingAddress.street")
        .notEmpty()
        .withMessage("Street is required"), 
        body("shippingAddress.city")
        .notEmpty()
        .withMessage("City is required"),
        body("shippingAddress.state")
        .notEmpty()
        .withMessage("State is required"),
        body("shippingAddress.zipCode")
        .notEmpty()
        .withMessage("Zip Code is required"),
        body("shippingAddress.country")
        .notEmpty()
        .withMessage("Country is required")
        .bail(),
        ValidateAddress
    
]
module.exports={CreateOrderValidationRule,UpdateAddressValidationRule}