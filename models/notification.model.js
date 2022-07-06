var mongoose = require('mongoose');
var notificationSchema = mongoose.Schema({

    date: {
        type: String
    },
    time: {
        type: String
    },
    message: {
        type: String
    },
    customerId : {
        type: mongoose.Types.ObjectId,
        ref: "Customer"
    },
    staffId: {
        type: mongoose.Types.ObjectId,
        ref: "Staff"
    },
});

module.exports = mongoose.model("Notification", notificationSchema);