var mongoose = require('mongoose');
var staffSchema = mongoose.Schema({

    name: {
        type: String
    },
    mobileNo: {
        type: String
    },
    customerId: {
        type: mongoose.Types.ObjectId,
        ref: "Customer"
    },
    type: {
        type: String,
        default: 'Staff'
    },
    fcmToken: {
        type: String
    }
});

module.exports = mongoose.model("Staff", staffSchema);