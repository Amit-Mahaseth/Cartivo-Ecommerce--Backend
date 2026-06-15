const mongoose=require("mongoose")

const ProductSchema=new mongoose.Schema({
    title:{
        type:string,
        required:true
    },
    description:{
        type:string,
    },
    price:{
        amount:{
            type:Number,
            required:true   
    },
    currency:{
        type:string,
    enum:["USD","INR"],
    default:"INR"
    }
},
image:[{
type:string,
required:true,
thumbnail:{
    type:string,
    required:true
}
}],
seller:{
    type:mongoose.Schema.Types.ObjectId,
required:true
}

})

const ProductModel=mongoose.model("product",ProductSchema);

module.exports=ProductModel