const mongoose=require("mongoose")


const PaymentSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    object:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    razpayObjectId:{
        type:String

    },
      paymentId: {
    type: String,
  },
  signature: {
    type: String,
  },
   status: {
    type: String,
    default: 'pending',
  },
    price:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            default:"INR",
            enum:["INR","USD"],
            required:true
        }
    }
},{
    timestamps:true
})

const PaymentModel=mongoose.model("user",PaymentSchema)

module.exports=PaymentModel