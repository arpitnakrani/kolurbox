require("dotenv").config();
const express = require('express');
const config = require("../config");
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment-timezone');

const orderSchema = require('../models/order.model');
const itemSchema = require('../models/item.model');

router.post('/addOrder', async function(req, res, next){
    const{ customerId, staffId, orderContent, itemId, itemQty, quantity, description } = req.body;
    let dateTimeIs = moment().format('DD/MM/YYYY,h:mm:ss a').split(',');
    let dateIs = dateTimeIs[0];
    let timeIs = dateTimeIs[1];
    try {
        let addOrder = await new orderSchema({
            customerId: customerId,
            staffId: staffId,
            orderContent: orderContent,
            quantity: quantity,
            date: dateIs,
            time: timeIs,
            description: description
        });
        if(addOrder != null){
            addOrder.save();
            res.status(200).json({ IsSuccess: true, Data: [addOrder], Message: "Order Registered !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/orderCalc', async function(req, res, next){
    const{ orderContent } = req.body;

    let totalQty = 0;
    let itemIs;
    let itemIdIs;
    let itemNoIs = [];

    for(let i=0; i<orderContent.length; i++){
        itemIdIs = orderContent[i].itemId;
        let itemQtyIs = orderContent[i].itemQty;
        itemIs = await itemSchema.find({_id: itemIdIs});
        totalQty += itemQtyIs;
        itemNoIs.push(itemIs[0]);
        // console.log(itemIs);
        // console.log(itemQtyIs);
        // console.log(totalprice);
        // console.log(totalQty);
        // console.log(totalAmount);
    }
    console.log(itemNoIs);

    let dataset = {
        quantity: totalQty,
        item: itemNoIs
    };
    // console.log(dataset);
    res.status(200).json({ IsSuccess: true, Data: [dataset], Message: "Calculation Found !"});
});

router.post('/getCart', async function(req, res, next){
    const{ customerId } = req.body;
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {customerId: mongoose.Types.ObjectId(customerId)},
                        {status: "pending"}
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
                    "staffId.mobileNo": 0
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
            res.status(200).json({ IsSuccess: true, Count:existOrder.length, Data: existOrder, Message: "Cart Item Found"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Item Not Found!"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getStaffCart', async function(req, res, next){
    const{ staffId } = req.body;
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {staffId: mongoose.Types.ObjectId(staffId)},
                        {status: "pending"}
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
                    "staffId.mobileNo": 0
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
            res.status(200).json({ IsSuccess: true, Count:existOrder.length, Data: existOrder, Message: "Cart Item Found"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Item Not Found!"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/confirmOrder', async function(req, res, next){
    const{ orderId, orderContent, quantity } = req.body;
    let dateTimeIs = moment().format('DD/MM/YYYY,h:mm:ss a').split(',');
    let dateIs = dateTimeIs[0];
    let timeIs = dateTimeIs[1];
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {_id: mongoose.Types.ObjectId(orderId)},
                        {status: "pending"}
                    ]
                }
            }
        ]);
        if(existOrder.length == 1){
            let updateIs = {
                orderContent: orderContent,
                quantity: quantity,
                status: "confirmed",
                date: dateIs,
                time: timeIs
            }
            let updateStatus = await orderSchema.findByIdAndUpdate(orderId,updateIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Order Confirm"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/updateConfirmOrder', async function(req, res, next){
    const{ orderId, orderContent, quantity, description } = req.body;
    let dateTimeIs = moment().format('DD/MM/YYYY,h:mm:ss a').split(',');
    let dateIs = dateTimeIs[0];
    let timeIs = dateTimeIs[1];
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {_id: mongoose.Types.ObjectId(orderId)},
                        {status: "confirmed"}
                    ]
                }
            }
        ]);
        if(existOrder.length == 1){
            let updateIs = {
                orderContent: orderContent,
                quantity: quantity,
                date: dateIs,
                time: timeIs,
                description: description == undefined ? existOrder[0].description : description,
            }
            let updateStatus = await orderSchema.findByIdAndUpdate(orderId,updateIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Order Confirm"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/cancelOrder', async function(req, res, next){
    const{ orderId } = req.body;
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    $and: [
                        {_id: mongoose.Types.ObjectId(orderId)},
                        {status: "pending"}
                    ]
                }
            }
        ]);
        if(existOrder.length == 1){
            let statusIs = {
                status: "cancel"
            }
            let updateStatus = await orderSchema.findByIdAndUpdate(orderId,statusIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Order Cancel"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getSingleOrder', async function(req, res, next){
    const{orderId} = req.body;
    try {
        let existOrder = await orderSchema.find({
                _id: mongoose.Types.ObjectId(orderId)
        })
        .populate({
            path: "orderContent.itemId"
        })
        .populate({
            path: "customerId"
        });
        // let existOrder = await orderSchema.aggregate([
        //     {
                // $match: {
                //     _id: mongoose.Types.ObjectId(orderId)
                // }
        //     },{
        //         $lookup: {
        //             from: "customers",
        //             localField: "customerId",
        //             foreignField: "_id",
        //             as: "customerId"
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "items",
        //             localField: "orderContent.itemId",
        //             foreignField: "_id",
        //             as: "itemId"
        //         }
        //     },
        //     {
        //         $project: {
        //             "customerId.type": 0,
        //             "customerId.companyName": 0,
        //         }
        //     },
        //     {
        //         $project: {
        //             "itemId.price": 0,
        //             "itemId.categoryId": 0,
        //         }
        //     },
        // ]);
        if(existOrder){
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Order found"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Order not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/addBillEmpGo', async function(req, res, next){
    const{ orderId, billNo, employeeId, godownBoy } = req.body;
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(orderId)
                }
            }
        ]);
        console.log(existOrder);
        if(existOrder.length == 1){
            let updateIs = {
                billNo: billNo,
                employeeId: employeeId,
                godownBoy: godownBoy,
                status: "delivered"
            }
            let updateOrder = await orderSchema.findByIdAndUpdate(orderId, updateIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Bill No Added"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/updatePrintStatus', async function(req, res, next){
    const { orderId } = req.body;
    try {
        let existOrder = await orderSchema.aggregate([
            {
                $match:{
                    _id: mongoose.Types.ObjectId(orderId)
                }
            }
        ]);
        if(existOrder.length == 1){
            let updateIs = {
                printStatus: true
            }
            let updatePrint = await orderSchema.findByIdAndUpdate(orderId, updateIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match:{
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "print status updated"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order Not Found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllPrintstatus', async function(req, res, next){
    try {
        let existPrint = await orderSchema.find({
            $and: [
                {printStatus: false},
                {status: {$ne: "cancel"}}
            ]
        })
        .populate({
            path: "orderContent.itemId"
        })
        .populate({
            path: "customerId"
        });
        if(existPrint.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existPrint.length, Data: existPrint, Message: "data found"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "data not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
})

module.exports = router;