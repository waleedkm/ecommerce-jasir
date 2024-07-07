const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    image:{
    type:[String],
    required:true
    },
    is_blocked:{
        type:Boolean
    }
    
})
module.exports = mongoose.model('Category',categorySchema)