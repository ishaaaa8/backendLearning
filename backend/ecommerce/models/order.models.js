import mongoose from "mongoose"

//creating mini schema
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    },
    quantity: {
        type: Number,
        required: true
    }

})
const orderSchema = new mongoose.Schema({
     orderPrice: {
        type: Number,
        required: true
     },
     customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
     },
     orderItems: {
        type: [ orderItemSchema ]
        //or 
        // {
        //     productId: {
        //         type: mongoose.Schema.Types.ObjectId,
        //     ref: "product",
        //     },
        //     quantity: {
        //         type:SVGAnimatedNumber
        //     }
        // }
     },
     address: {
        type: String,
        required: true
     },
     status: {
        type: String,
        enum: ["PENDING" , "CANCELLED" , "DELIVERED"],
        default: "PENDING"
     }

},{timestamps: true});

export const order = mongoose.model("order", orderSchema);