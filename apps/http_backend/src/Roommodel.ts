import mongoose from "mongoose";

const roomSchema =new mongoose.Schema({
    email : {required : true , type : String  },
    document : {type:String},
    slug:{type: String, required: true},
    people:{type:Array}
})

export const roomModel = mongoose.model("Room",roomSchema)