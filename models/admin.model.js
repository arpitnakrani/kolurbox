var mongoose = require('mongoose');
var adminSchema = mongoose.Schema({

    name: {
        type: String
    },
    mobileNo: {
        type: String
    },
    companyName: {
        type: String
    },
    password: {
        type: String
    },
});

module.exports = mongoose.model("Admin", adminSchema);