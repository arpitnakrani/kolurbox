var mongoose = require('mongoose');
var itemSchema = mongoose.Schema({

    itemNo: {
        type: String
    },
    price: {
        type: Number
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Category"
    }  
});

module.exports = mongoose.model("Item", itemSchema);