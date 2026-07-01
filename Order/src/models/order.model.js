const mongoose=require("mongoose")


const AddressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type:String, required: true },
    isdefault: { type: Boolean, default: false },
    country: { type: String, required: true }
});
const OrderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            }
        }
    ],
          price:{
amount:{
    type:Number,
    required:true
},
currency:{
    type:String,
    enum:["USD","INR"],
    default:"INR"
}
            },

            totalAmount:{
type:Number,
required:true
            },
            status:{
                type:String,
                enum:["Pending","Confirmed","Shipped","Delivered","Cancelled"],
                default:"Pending"
            },
            shippingAddress:{
                type:AddressSchema,
                required:true
            }
}, { timestamps: true })

const OrderModel=mongoose.model("order",OrderSchema)

module.exports=OrderModel