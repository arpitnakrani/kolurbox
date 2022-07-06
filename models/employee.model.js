var mongoose = require('mongoose');
var employeeSchema = mongoose.Schema({

    name: {
        type: String
    },
    mobileNo: {
        type: String
    },
});

module.exports = mongoose.model('Employee', employeeSchema);