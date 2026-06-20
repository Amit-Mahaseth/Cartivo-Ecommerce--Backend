const mongoose=require('mongoose');

function connectDB(){
    try{
        mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
    }catch(err){
        console.error("Error connecting to MongoDB",err);
    }
}
module.exports=connectDB