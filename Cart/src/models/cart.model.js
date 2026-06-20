const mongoose=require("mongoose")

const CartSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    items:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
                min:1,
            }
        }
    ],
    timestamp:{
        type:Date,
        default:Date.now,
    }
})

const CartModel=mongoose.model("Cart",CartSchema);

module.exports=CartModel;