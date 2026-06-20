const CartModel=require("../models/cart.model")

async function GetCart(req,res){
    const user=req.user
    try{
        let  cart=await CartModel.findOne({user:user._id.toString()})
        if(!cart){
        cart=new CartModel({user:user._id.toString(),items:[]})
        await cart.save()
        }

        return res.status(200).json({
            message:"cart retrieved",
            data:cart
        })
        
    }catch(error){  
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}

async function CreateCartItem(req,res){
    const {productId,quantity}=req.body;
    const user=req.user
    if (quantity===undefined || quantity===null || quantity < 1) {
    return res.status(400).json({
        message: "quantity must be at least 1"
    });
}
    if(!productId){
        return res.status(400).json({
            message:"productId is required"
        })
    }
    try{
let  cart =await CartModel.findOne({user:user._id.toString()})
if(!cart){
    cart=new CartModel({user:user._id.toString(),items:[]})
}
const existingIndex=cart.items.findIndex(item=>item.productId.toString()===productId)

if(existingIndex>=0){
    cart.items[existingIndex].quantity+=quantity
        await cart.save();

    return res.status(200).json({
        message: "cart updated",
        data: cart
    });
}else{
    cart.items.push({productId,quantity})
}
await cart.save()
return res.status(201).json({
    message:"item added to cart",
   data: cart

})

    }catch(error){
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}

async function UpdateCartItem(req,res){
    const {productId}=req.params;
    const {quantity}=req.body;
    const user=req.user
    if (quantity===undefined || quantity===null || quantity < 1) {
    return res.status(400).json({
        message: "quantity must be at least 1"
    });
}
    try{
const cart=await CartModel.findOne({user:user._id.toString()})
if(!cart){
    return res.status(404).json({
        message:"cart not found"
    })
}
const existingIndex=cart.items.findIndex(item=>item.productId.toString()===productId)
if(existingIndex<0){
    return res.status(404).json({
        message:"product not found in cart"
    })
}
cart.items[existingIndex].quantity=quantity
await cart.save()
return res.status(200).json({
    message:"cart item updated",
    data:cart
})
    }catch(error){
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
}
}

module.exports={CreateCartItem, UpdateCartItem,GetCart}

