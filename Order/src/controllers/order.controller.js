const axios = require("axios")
const OrderModel=require("../models/order.model")

async function CreateOrder(req,res){
    const {shippingAddress}=req.body;
    if(!shippingAddress){
        return res.status(400).json({message:"shippingAddress is required"})
    }
    const user=req.user
    const token=req.cookies?.token ||req.headers?.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({message:"Unauthorized"})
    }
    try{
        const cartResponse = await axios.get(`http://localhost:3002/api/cart`,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })



        const cartItems = cartResponse.data.cart.items;

      console.log("cartItems",cartItems);
        if (!cartItems.length) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const products =await Promise.all(cartItems.map(async(item)=>{
            return (
                await axios.get(`http://localhost:3001/api/products/${item.productId}`,{
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                })
            ).data.product
        }))

        let priceAmount=0

        const OrderItems=cartItems.map((item)=>{
            
            const product=products.find(p=>p._id.toString()===item.productId.toString())
    
    if(!product){
        throw new Error(`Product not found for ${item.productId}`)
    }
    
    if(!product.stock || product.stock<item.quantity){

        throw new Error(`Product ${product.title} is out of stock`)
    }
      const itemTotalPrice=product.price.amount*item.quantity
      priceAmount+=itemTotalPrice
      return{
        product:item.productId,
        quantity:item.quantity
      }
        })

        
        const order=await OrderModel.create({
            user:user.userId,
            items:OrderItems,
            shippingAddress,
            price:{
                amount:priceAmount,
                currency:"INR"
            },
            totalAmount:priceAmount
        })
        return res.status(201).json({
            message: "Order created successfully",
            order: order
        })
    }catch(err){
        console.error("Error:", err.message)
        return res.status(500).json({
            "message": err.message
        })
    }
}

async function getMyOrders(req,res){

    const user=req.user
      try{
    if(!user){
        return res.status(401).json({message:"Unauthorized"})
    }
        if(req.user.role!=="user"){
        return res.status(403).json({message:"Forbidden"})
    }
    const page=parseInt(req.query.page) || 1
    const limit=parseInt(req.query.limit) || 10
    const skip=(page-1)*limit
    
    const order=await OrderModel.find({user:req.user.userId}).populate("items.product").skip(skip).limit(limit)
    if(order.length===0){
        return res.status(404).json({message:"No orders found"})
    }
    const totalOrders=await OrderModel.countDocuments({user:req.user.userId})
    return res.status(200).json({ 
        orders: order,
        meta: {
       total: totalOrders,
         page: page,
         limit: limit,
        }
     })
    }catch(err){
        console.error(err);
        return res.status(500).json({
            message:"Internal server error"
        })
    }
}
async function getOrderById(req,res){
    const user=req.user
    const orderId=req.params.id
    if(!user){
        return res.status(401).json({message:"Unauthorized"})
    }
try{
const order=await OrderModel.findById(orderId).populate("items.product")

if(!order){
    return res.status(404).json({message:"Order not found"})
}
if(order.user.toString()!==user.userId){
    return res.status(403).json({message:"you are not authorized to view this order"})
}
return res.status(200).json({order:order})
}catch(err){
    return res.status(500).json({message:err.message})
}

}
async function cancelOrder(req,res){
    const user=req.user
    const orderId=req.params.id
    if(!user){
        return res.status(401).json({message:"Unauthorized"})
    }
try{
const order=await OrderModel.findById(orderId)
if(!order){
    return res.status(404).json({message:"Order not found"})
}
if(order.user.toString()!==user.userId){
    return res.status(403).json({message:"you are not authorized to cancel this order"})    
}
if(order.status!=="pending"){
    return res.status(400).json({message:"Order cannot be cancelled"})
}
order.status="cancelled"
await order.save()
return res.status(200).json({message:"Order cancelled successfully",order:order})
}catch(err){
    return res.status(500).json({message:err.message})
}
}
async function UpdateAddress(req,res){
    const {shippingAddress}=req.body
    if(!shippingAddress){
        return res.status(400).json({message:"shippingAddress is required"})
    }
    const user=req.user
    const OrderId=req.params.id
    try{
if(!user){
    return res.status(401).json({message:"Unauthorized"})
}
const order=await OrderModel.findById(OrderId)
if(!order){
    return res.status(404).json({message:"Order not found"})
}
if(order.user.toString()!==user.userId){
    return res.status(403).json({message:"you are not authorized to update this order"})    
}
if(order.status!=="pending"){
    return res.status(400).json({message:"Order cannot be updated"})
}
order.shippingAddress=shippingAddress
await order.save()
return res.status(200).json({message:"Address updated successfully",order:order})

    }catch(err){
        return res.status(500).json({
            message:err.message
        })
    }
}
module.exports={CreateOrder, getMyOrders, getOrderById, cancelOrder,UpdateAddress}
