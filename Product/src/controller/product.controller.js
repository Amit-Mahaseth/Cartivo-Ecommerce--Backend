const ProductModel=require("../model/product.model");


async function createProduct(req,res){

    try {
const {title,description,price:{amount,currency},image,role}=req.body;
const product=await ProductModl.create({
title,
description,
price: { amount, currency },
image,
role
})
    } catch (error) {



    }
}