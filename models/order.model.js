var mongoose = require('mongoose');
var orderSchema = mongoose.Schema({

    customerId: {
        type: mongoose.Types.ObjectId,
        ref: "Customer"
    },
    staffId: {
        type: mongoose.Types.ObjectId,
        ref: "Staff"
    },
    orderContent: [
        {
            itemId: {
                type: mongoose.Types.ObjectId,
                ref: "Item"
            },
            itemQty: {
                type: Number
            }
        }
    ],
    quantity: {
        type: Number
    },
    date: {
        type: String
    },
    time: {
        type: String
    },
    status: {
        type: String,
        default: "pending"
    },
    billNo: {
        type: String
    },
    printStatus: {
        type: Boolean,
        default: false
    },
    employeeId: {
        type: mongoose.Types.ObjectId,
        ref: "Employee"
    },
    godownBoy: {
        type: mongoose.Types.ObjectId,
        ref: "Employee"
    },
    description: {
        type: String
    }, 
});

module.exports = mongoose.model("Order", orderSchema);