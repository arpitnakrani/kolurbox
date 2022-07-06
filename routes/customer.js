require("dotenv").config();
const express = require('express');
const config = require("../config");
const router = express.Router();
const mongoose = require('mongoose');

const customerSchema = require('../models/customer.model');
const staffSchema = require('../models/staff.model');
const orderSchema = require('../models/order.model');

router.post('/signUp', async function(req, res, next){
    const{ name, mobileNo, companyName, address, latitude, longitude } = req.body;
    try {
        let existCustomer = await customerSchema.aggregate([
            {
                $match: {
                    mobileNo: mobileNo
                }
            }
        ]);
        if(existCustomer.length == 1){
            res.status(200).json({ IsSuccess: true, Data: [], Message: "MobileNo. Already exists !"});
        }else{
            let addCustomer = await new customerSchema({
                name: name,
                mobileNo: mobileNo,
                companyName: companyName,
                address: address,
                latitude: latitude,
                longitude: longitude
            });
            if(addCustomer != null){
                addCustomer.save();
            res.status(200).json({ IsSuccess: true, Data: [addCustomer], Message: "Customer Signup Succesfully !"});
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/login', async function(req, res, next){
    const{ mobileNo, fcmToken } = req.body;
    try {
        let existCustomer = await customerSchema.aggregate([
            {
                $match: {
                    mobileNo: mobileNo
                }
            }
        ]);

        let existStaff = await staffSchema.aggregate([
            {
                $match: {
                    mobileNo: mobileNo
                }
            }
        ]);

        if(existCustomer.length == 1){
            let updateIs = {
                fcmToken: fcmToken != undefined ? fcmToken : ""
            }
            let updateCustomer = await customerSchema.findByIdAndUpdate(existCustomer[0]._id, updateIs);
            res.status(200).json({ IsSuccess: true, Data: existCustomer, Message: "Logged In !"});
        }else if(existStaff.length == 1){
            let updateStaff = await staffSchema.findByIdAndUpdate(existStaff[0]._id, updateIs);
            res.status(200).json({ IsSuccess: true, Data: existStaff, Message: "Logged In !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Invalid Mobileno. !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/addStaff', async function(req, res, next){
    const{ name, mobileNo, customerId } = req.body;
    try {
        let existStaff = await staffSchema.aggregate([
            {
                $match: {
                    mobileNo: mobileNo
                }
            }
        ]);
        if(existStaff.length == 1){
            res.status(200).json({ IsSuccess: true, Data: [], Message: "MobileNo. Already exists !"});
        }else{
            let addStaff = await new staffSchema({
                name: name,
                mobileNo: mobileNo,
                customerId: customerId
            });
            if(addStaff != null){
                addStaff.save();
                res.status(200).json({ IsSuccess: true, Data: [addStaff], Message: "Staff Added !"});
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/deleteStaff', async function(req, res, next){
    const{ staffId } = req.body;
    try {
        let existStaff = await staffSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(staffId)
                }
            }
        ]);
        if(existStaff.length == 1){
            let deleteStaff = await staffSchema.findByIdAndDelete(staffId);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Staff Deleted !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "User Not Found" });
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getCustomerStaff', async function(req, res, next){
    const{ customerId } = req.body;
    try {
        let existstaff = await staffSchema.aggregate([
            {
                $match: {
                    customerId: mongoose.Types.ObjectId(customerId)
                }
            }
        ]);
        if(existstaff.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existstaff.length, Data: existstaff, Message: "Data Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

// ---------------get order-------------
// -------------changes in order 27-04-2021-------
router.post('/getCustomerOrder', async function(req, res, next){
    const{ customerId } = req.body;
    try {
        let sortDate = {date: -1, time: -1};
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {customerId: mongoose.Types.ObjectId(customerId)},
                        {status: "delivered"}
                    ]
                }
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerId"
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staffId"
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "orderContent.itemId",
                    foreignField: "_id",
                    as: "itemId"
                }
            },
            {
                $project: {
                    "customerId.mobileNo": 0,
                    "customerId.companyName": 0,
                    "customerId.address": 0,
                    "customerId.fcmToken": 0
                }
            },
            {
                $project: {
                    "staffId.mobileNo": 0,
                    "staffId.customerId": 0
                }
            },
            {
                $project: {
                    "itemId.price": 0,
                    "itemId.categoryId": 0,
                }
            },
            {
                $sort: sortDate
            },
        ]);
        if(existOrder.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existOrder.length, Data: existOrder, Message: "Order Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getStaffOrder', async function(req, res, next){
    const{ staffId } = req.body;
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {staffId: mongoose.Types.ObjectId(staffId)},
                        {status: "delivered"}
                    ]
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staffId"
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "orderContent.itemId",
                    foreignField: "_id",
                    as: "itemId"
                }
            },
            {
                $project: {
                    "staffId.mobileNo": 0,
                    "staffId.customerId": 0
                }
            },
            {
                $project: {
                    "itemId.price": 0,
                    "itemId.categoryId": 0,
                }
            },
        ]);
        if(existOrder.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existOrder.length, Data: existOrder, Message: "Order Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getCustomerConfirmOrder', async function(req, res, next){
    const { customerId } = req.body;
    try {
        let confirmOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {customerId: mongoose.Types.ObjectId(customerId)},
                        {status: "confirmed"}
                    ]
                }
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerId"
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staffId"
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "orderContent.itemId",
                    foreignField: "_id",
                    as: "itemId"
                }
            },
            {
                $project: {
                    "customerId.mobileNo": 0,
                    "customerId.companyName": 0,
                    "customerId.address": 0,
                }
            },
            {
                $project: {
                    "staffId.mobileNo": 0,
                    "staffId.customerId": 0
                }
            },
            {
                $project: {
                    "itemId.price": 0,
                    "itemId.categoryId": 0,
                }
            },
        ]);
        if(confirmOrder.length > 0){
            res.status(200).json({ IsSuccess: true, Data: confirmOrder, Message: "Confirm Order Found!"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order Not Found!"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getStaffConfirmOrder', async function(req, res, next){
    const { staffId } = req.body;
    try {
        let confirmOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {staffId: mongoose.Types.ObjectId(staffId)},
                        {status: "confirmed"}
                    ]
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staffId"
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "orderContent.itemId",
                    foreignField: "_id",
                    as: "itemId"
                }
            },
            {
                $project: {
                    "staffId.mobileNo": 0,
                    "staffId.customerId": 0
                }
            },
            {
                $project: {
                    "itemId.price": 0,
                    "itemId.categoryId": 0,
                }
            },
        ]);
        if(confirmOrder.length > 0){
            res.status(200).json({ IsSuccess: true, Data: confirmOrder, Message: "Confirm Order Found!"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order Not Found!"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllStaff', async function(req, res, next){
    try {
        let existStaff = await staffSchema.aggregate([
            {
                $match: {}
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerId"
                }
            },
            {
                $project: {
                    "customerId.type": 0,
                    "customerId.mobileNo": 0,
                    "customerId.companyName": 0,
                    "customerId.address": 0,
                }
            }
        ]);
        if(existStaff.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existStaff.length, Data: existStaff, Message: "Item's Data Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data not Found !"});
        }   
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/deleteCustomer', async function(req, res, next){
    const{ customerId } = req.body;
    try {
        let existCustomer = await customerSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(customerId)
                }
            }
        ]);
        if(existCustomer.length == 1){
            let deleteCustomer = await customerSchema.findByIdAndDelete(customerId);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Customer Deleted !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "Customer not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});
module.exports = router;