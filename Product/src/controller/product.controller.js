const ProductModel=require("../models/product.model");
const { uploadImage } = require("../services/imagekit.service");
const mongoose=require("mongoose")

async function createProduct(req,res){
    try {
const {title,description,priceAmount,priceCurrency="INR"}=req.body;

if(!title || !priceAmount){
    return res.status(400).json({message:"Title and priceAmount are required"});
}

const seller=req.user._id;
const price={
    amount:Number(priceAmount),
    currency:priceCurrency
}

const images=await Promise.all((req.files || []).map(file=> uploadImage(file.buffer)))

const product=await ProductModel.create({
    title,description,price,seller,images
})
return res.status(201).json({
    message:"Product Created Successfully",
    data:product
})
    } catch (error) {
return res.status(500).json({
    error:error.message,
    message:"internal server error"
})
    }
}


async function getProducts(req,res){
    const {q,minPrice,maxPrice,skip=0,limit=20}=req.query;
        try {
    const filter={};
    if(q){
filter.$text={$search:q}
    }
    if(minPrice){
    filter["price.amount"]={...filter['price.amount'],$gte:Number(minPrice)}
    }
    if(maxPrice){
    filter["price.amount"]={...filter['price.amount'],$lte:Number(maxPrice)}
    }
        const products=await ProductModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit),20)).populate("seller","username email"); 
    return res.status(200).json({
        message:"Products fetched successfully",
        data:products
    })
        
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}

async function getProductById(req,res){
    const {id}=req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product ID"
        })
    }
    try {
        const product=await ProductModel.findById(id).populate("seller","username email")
        if(!product){
            return res.status(404).json({
                message:"Product not found"
            });
        }
        return res.status(200).json({
            message:"Product fetched successfully",
            data:product,
            product:product
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}

async function updateProduct(req,res){
    const {id}=req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product ID"
        })
    }
    try {
        const product=await ProductModel.findOne({
            _id:id,
        })
        if(!product){
            return res.status(404).json({
                message:"Product not found"
            })
        }
        if(
            req.user.role !=="admin"&&
            product.seller.toString()!==req.user._id){
            return res.status(403).json({
                message:"You are not authorized to update this product"
            })
        }

     if (req.body.title !== undefined) {
    product.title = req.body.title;
}

if (req.body.description !== undefined) {
    product.description = req.body.description;
}

if (req.body.priceAmount !== undefined) {
    product.price.amount = req.body.priceAmount;
}

if (req.body.priceCurrency !== undefined) {
    product.price.currency = req.body.priceCurrency;
}
        await product.save();
        return res.status(200).json({
            message:"Product updated successfully",
            data:product
        })
        
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}
async function deleteProduct(req,res){
    const {id}=req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            message:"Invalid product ID"
        })
    }
    try {
        const product=await ProductModel.findOne({
            _id:id,
        })
        if(!product){
            return res.status(404).json({
                message:"Product not found"
            })
        }
        if(
            req.user.role !=="admin"&&
            product.seller.toString()!==req.user._id){
            return res.status(403).json({
                message:"You are not authorized to delete this product"
            })
        }

        await product.deleteOne();
        return res.status(200).json({
            message:"Product deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}

async function getSellerProducts(req,res){
    const {skip=0,limit=20}=req.query;
    try {
        const products=await ProductModel.find({seller:req.user._id}).skip(Number(skip)).limit(Math.min(Number(limit),20));

        return res.status(200).json({
            message:"Seller products fetched successfully",
            data:products
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"internal server error"
        })
    }
}
module.exports={createProduct,getProducts,getSellerProducts,getProductById,updateProduct,deleteProduct}
