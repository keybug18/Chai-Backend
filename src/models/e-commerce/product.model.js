import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    description:{
        type: String,
        required: true,
        l
    },
   
    name:{
        type: String,
        required: true,
        lowercase: true,

    },

    productimage:{
        type: String,
        required: true,                    
    },

    price:{
        type: Number,
        required: true,
        default : 0 ,
    },

    stock:{
        type: Number,
        required: true,
        default : 0 ,
    },

    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true, 
    }

} , { timestamps: true });                        


export const Product = mongoose.model("Product", productSchema);