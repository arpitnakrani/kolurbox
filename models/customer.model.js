var mongoose = require('mongoose');
const { strike } = require('pdfkit');
var customerSchema = mongoose.Schema({

    name: {
        type: String
    },
    mobileNo: {
        type: String
    },
    companyName: {
        type: String
    },
    address: {
        type: String
    },
    latitude: {
        type: String
    },
    longitude: {
        type: String
    },
    type: {
        type: String,
        default: 'Customer'
    },
    fcmToken: {
        type: String
    } 
});

module.exports = mongoose.model("Customer", customerSchema);