const mongoose=require('mongoose');

async function connectDB(){
    try{
        const uri = process.env.MONGO_URI;
        if(!uri){
            console.log("MongoDB URI not provided, skipping connection");
            return;
        }
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
    }catch(err){
        console.error("Error connecting to MongoDB",err);
        throw err;
    }
}
module.exports=connectDB
