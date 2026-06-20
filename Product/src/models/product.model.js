const mongoose=require("mongoose")

const ProductSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
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
images:[{
url:String,
thumbnail: String,
id:String
}],
seller:{
    type:mongoose.Schema.Types.ObjectId,
required:true
}

})

ProductSchema.index({title:"text",description:"text"})  
const ProductModel=mongoose.model("product",ProductSchema);

module.exports=ProductModel