const PaymentModel=require("../models/payment.model")
const axios=require("axios")
const Razorpay = require('razorpay');

async function CreatePayment(req,res) {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    try{
        const orderId=req.params.id
        const token=req.cookies?.token || req.headers?.authorization?.split(" ")[1]
        const user=req.user

        if(!orderId){
            return res.status(400).json({message:"order id is required"})
        }
        if(!token){
            return res.status(401).json({message:"Unauthorized"})
        }
        if(!user?.userId && !user?._id){
            return res.status(401).json({message:"Unauthorized"})
        }

        const orderResponse=await axios.post(`http://localhost:3003/api/orders/${orderId}`,{}, {
            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${token}`
            }
        })

        const order=orderResponse?.data?.order
        if(!order){
            return res.status(404).json({message:"Order not found"})
        }

        const priceAmount=Number(order.price?.amount || order.totalAmount || 0)*100
        const razorpayOrder=await razorpay.orders.create({
            amount: priceAmount,
            currency: order.price?.currency || "INR",
            receipt: orderId,
        })

        const payment=await PaymentModel.create({
            user: user.userId || user._id,
            object: orderId,
            razpayObjectId: razorpayOrder?.id || null,
            status:"pending",
            price:{
                amount: razorpayOrder?.amount || priceAmount,
                currency: razorpayOrder?.currency || (order.price?.currency || "INR")
            }
        })

        return res.status(200).json({
            message:"Payment created successfully",
            payment
        })
    }catch(err){
        console.error("Payment error:", err.message)
        return res.status(500).json({
            message: err.message || "Internal Server Error"
        })
    }
}
async function VerifyPayment(req,res){
     const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET
      try{
    const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')
    const isValid = validatePaymentVerification(
        {
            order_id: razorpayOrderId,
            payment_id: razorpayPaymentId,
        },
        signature,
        secret
    );      
if(!isValid){
    return res.status(400).json({message:"Invalid signature"})
}
const payment=await PaymentModel.findOne({razpayObjectId:razorpayOrderId,status:"pending"})
payment.paymentId=razorpayPaymentId
payment.signature=signature
payment.status="completed"
await payment.save()
return res.status(200).json({
    message:"Payment verified successfully",
    payment
})
      }catch(err){
        return res.status(500).json({
            message: err.message || "Internal Server Error"
        })
      }
}
module.exports={CreatePayment, VerifyPayment}