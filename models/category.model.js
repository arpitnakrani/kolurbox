var mongoose = require('mongoose');
var categorySchema = mongoose.Schema({

    categoryName: {
        type: String
    },
});

module.exports = mongoose.model('Category', categorySchema);