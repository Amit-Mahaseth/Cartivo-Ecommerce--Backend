const jwt=require('jsonwebtoken');

const CreateAuthMiddleware=(roles=["user"])=>{
    return  function AuthMiddleware(req,res,next) {
const token=req.cookies?.token ||req.headers?.authorization?.split(" ")[1];
if(!token){
    return res.status(401).json({message:"Unauthorized"})}      
try{
    
const decoded=jwt.verify(token,process.env.JWT_SECRET);
if(!decoded){
    return res.status(401).json({message:"Unauthorized"})
}

if(!roles.includes(decoded.role)){
    return res.status(403).json({message:"Forbidden"});
}
req.user=decoded;
next();
    
}catch(err){
    return res.status(401).json({message:"Unauthorized"})
}

}}


module.exports=CreateAuthMiddleware;