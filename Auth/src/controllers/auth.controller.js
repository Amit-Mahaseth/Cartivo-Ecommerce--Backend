const jwt=require("jsonwebtoken")
const bcrypt=require('bcrypt');
const UserModel=require('../models/user.model');
const redis=require("../db/redis")
async function register(req, res) {
const { username, email,role, password, FullName, phone, Address } = req.body;
try {
  const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] }).select("+password");

    if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
}
const hashPassword=await bcrypt.hash(password,10);
const user=await UserModel.create({ username, 
    email,
     password: hashPassword,
     FullName,
     role,
     phone,
     Address, });

     const token=jwt.sign({
         userId: user._id ,
         email: user.email,
         role: user.role,
         username:user.username,
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const UserResponse=user.toObject();
        delete UserResponse.password;
        res.cookie("token",token,{
           httpOnly:true,
            secure:true,
            maxAge:24*60*60*1000
        }
        )
res.status(201).json({ message: 'User registered successfully', 
    user: UserResponse});
}catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error' });  
}
}

async function Login(req,res){
    const { username,email, password } = req.body;
    if(!username && !email) {
        return res.status(400).json({ message: 'Username or email is required' });
    }
    const user=await UserModel.findOne({$or:[{username},{email}]}).select("+password");
  if (!user) {
    return res.status(401).json({
        message: 'Invalid credentials'
    });
}
    const isPasswordValid=await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(401).json({ message: 'Invalid password' });
    }
 
     const token=jwt.sign({
         userId: user._id ,
         email: user.email,
         role: user.role,
         username:user.username,    
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie("token",token,{
           httpOnly:true,
            secure:true,
            maxAge:24*60*60*1000
        })
           const UserResponse=user.toObject();
        delete UserResponse.password;
res.status(200).json({ message: 'Login successful',
    token, user: UserResponse }); 
}
async function getCurrentUser(req, res) {
    const user=req.user
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.status(200).json({ message: 'Current user retrieved successfully', user });
}
async function logout(req,res){
    const token=req.cookies.token
    if(token){
        await redis.set(`Blacklist:${token}`,'true',"EX",24*60*60)
    }
    res.clearCookie('token',{
       httpOnly:true,
        secure:true,
        sameSite:'strict'
    })

    return res.status(200).json({
        message:"Logged out successfully"
    })
}
async function AddUserAddress(req,res){
const id=req.user.userId
const {street,city,state,zipCode,country}=req.body
try{
const user=await UserModel.findOneAndUpdate({_id:id},
    {$push:{Address:{street,city,state,zipCode,country}}},{returnDocument: 'after' })
if(!user){
    return res.status(404).json({
        message:"user not found"
    })
}

return res.status(200).json({
    message:"Address added successfully",
    Address:user.Address
})
}catch(err){
    return res.status(500).json({ message: 'Server error' });
}
}
async function getUserAddresses(req,res){
    const id=req.user.userId
    try{
    const user=await UserModel.findById(id)

    if(!user){
        return res.status(404).json({
            message:"user not found"
        })
    }   
    return res.status(200).json({
        message:"Addresses retrieved successfully",
        Address:user.Address
    })
    }catch(err){
        return res.status(500).json({ message: 'Server error' });
    }
}

async function deleteUserAddress(req,res){
    try{
    const id=req.user.userId
    const {addressId}=req.params
    const user=await UserModel.findByIdAndUpdate(id,{$pull:{Address:{_id:addressId}}},{returnDocument: 'after' })

    if(!user){
        return res.status(404).json({
            message:"user not found"
        })
    }
        const addressExist=user.Address.some(addr=>addr._id.toString()==addressId.toString())
        if(addressExist){
            return res.status(400).json({
                message:"Failed to delete address"      
            })
        }
        return res.status(200).json({
            message:"Address deleted successfully",
            Address:user.Address
        })
    }catch(err){
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { register, Login,getCurrentUser,logout ,AddUserAddress,getUserAddresses,deleteUserAddress};
