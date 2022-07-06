require("dotenv").config();
const express = require('express');
const config = require("../config");
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const moment = require('moment-timezone');
const request = require('request');
const pdfkit = require('pdfkit');
var pdf = require("pdf-creator-node");
const fs = require('fs');
const path = require('path');
const options = require('../helpers/options');
const fontkit = require('fontkit');

const adminSchema = require('../models/admin.model');
const customerSchema = require('../models/customer.model');
const itemSchema = require('../models/item.model');
const bannerSchema = require('../models/banner.model');
const orderSchema = require('../models/order.model');
const categorySchema = require('../models/category.model');
const employeeSchema = require('../models/employee.model');
const notificationSchema = require('../models/notification.model');
const staffSchema = require('../models/staff.model')

const xlsxFile = require('read-excel-file/node');

var bannerImage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploads/bannerImage');
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + "_" + file.originalname);
    }
});

var uploadBanner = multer({storage: bannerImage});

// ------------------------admin signup--------------------
router.post('/adminSignup', async function(req, res, next){
    const{ name, mobileNo, companyName, password} = req.body;
    try {
        let adminIs = await new adminSchema({
            name: name,
            mobileNo: mobileNo,
            companyName: companyName,
            password: password
        });
        if(adminIs != null){
            adminIs.save();
            res.status(200).json({ IsSuccess: true, Data: [adminIs], Message: "Admin Signup !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post("/adminLogin", async function(req, res, next){
    const{ mobileNo, password } = req.body;
    try {
        let existAdmin = await adminSchema.aggregate([
            {
                $match: {
                    $and: [
                        {mobileNo: mobileNo},
                        {password: password}
                    ]
                }
            }
        ]);
        if(existAdmin.length == 1){
            res.status(200).json({ IsSuccess: true, Data: existAdmin, Message: "Admin Login !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "User Not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/dashcounters', async function(req, res, next){
    try {
        let employee = await employeeSchema.find().countDocuments();
        let customer = await customerSchema.find().countDocuments();
        let item = await itemSchema.find().countDocuments();
        let category = await categorySchema.countDocuments();
        let totalOrder = await orderSchema.find().countDocuments();
        let pendingOrder = await orderSchema.find({"status": "pending"}).countDocuments();
        let confirmOrder = await orderSchema.find({"status": "confirmed"}).countDocuments();
        let deliverOrder = await orderSchema.find({"status": "delivered"}).countDocuments();
        let cancelOrder = await orderSchema.find({"status": "cancel"}).countDocuments();
        let printOrder = await orderSchema.find({"printStatus": false}).countDocuments();

        totalOrder= totalOrder - cancelOrder;
        let dataList = [];
        dataList.push({
            totalEmployee: employee,
            totalCustomer: customer,
            totalItem: item,
            totalCategory: category,
            totalOrders: totalOrder,
            pendingOrders: pendingOrder,
            confirmOrders: confirmOrder,
            deliveredOrders: deliverOrder,
            canceledOrder: cancelOrder,
            printOrder: printOrder
        });
        res.status(200).json({ IsSuccess: true, Data: dataList, Message: "Data Found !"});

    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
})

// -----------------------------master table of category--------------------------

router.post('/addItemXlsx', async function(req, res, next) {
    try {
        let dataIs = [];
        xlsxFile('./excel/kolourbox.xlsx').then(async(rows) => {
            console.log(rows);
            console.log(rows.length);

            rows.forEach(async function(col) {
                let addItem = await new itemSchema({
                    itemNo: col[0],
                    categoryId: "6090caba397ea4390c08b083"
                });
                console.log(addItem);
                await addItem.save();
            });
        });
        // res.status(200).json({ Data: dataIs }); 
    } catch (error) {
        res.status(500).json({ Message: error.message, IsSuccess: false });
    }

    // res.send({x});
});


router.post('/addCategory', async function(req, res, next){
    const{categoryName} = req.body;
    try {
        let existCategory = await categorySchema.aggregate([
            {
                $match: {categoryName: categoryName}
            }
        ]);
        if(existCategory.length == 1){
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Name Already exist !"});
        }else{
            let addCategory = await new categorySchema({
                categoryName: categoryName
            });
            if(addCategory != null){
                addCategory.save();
                res.status(200).json({ IsSuccess: true, Data: [addCategory], Message: "Category Added !"});
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllcategory', async function(req, res, next){
    try {
        let existCategory = await categorySchema.aggregate([
            {
                $match: {}
            }
        ]);
        if(existCategory.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existCategory.length, Data: existCategory, Message: "Category Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Category not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/deleteCategory', async function(req, res, next){
    const{ categoryId } = req.body;
    try {
        let existCategory = await categorySchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(categoryId)
                }
            }
        ]);
        if(existCategory){
            let deleteCategory = await categorySchema.findByIdAndDelete(categoryId);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Category Deleted !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "category not found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
})

// ------------------------------master table items---------------------------------
router.post('/addItem', async function(req, res, next){
    const{ itemNo, price, categoryId } = req.body;
    try {
        let existItem = await itemSchema.aggregate([
            {
                $match: {
                    itemNo: itemNo
                }
            }
        ]);
        if(existItem.length == 1){
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Item Already exists !"});
        }else{
            let addItem = await new itemSchema({
                itemNo: itemNo,
                price: price,
                categoryId: categoryId
            });
            if(addItem != null){
                addItem.save();
                res.status(200).json({ IsSuccess: true, Data: [addItem], Message: "New Item added" });
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/deleteItem', async function(req, res, next){
    const{ itemId } = req.body;
    try {
        let existItem = await itemSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(itemId)
                }
            }
        ]);
        if(existItem.length == 1){
            let deleteItem = await itemSchema.findByIdAndDelete(itemId);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Item Deleted !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "Item not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllItem', async function(req, res, next){
    try {
        let existItem = await itemSchema.aggregate([
            {
                $match: {}
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryId"
                }
            },
        ]);
        if(existItem.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existItem.length, Data: existItem, Message: "Item's Data Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data not Found !"});
        }   
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getCategoryItem', async function(req, res, next){
    const{ categoryId } = req.body;
    try {
        let existItem = await itemSchema.aggregate([
            {
                $match: {
                    categoryId: mongoose.Types.ObjectId(categoryId)
                }
            }
        ]);
        if(existItem.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existItem.length, Data: existItem, Message: "Item's Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Item's Data not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
})

router.post('/addBanner', uploadBanner.single('bannerImage'), async function(req, res, next){
    const { bannerName, bannerImage } = req.body;
    let fileinfo = req.file;
    // let cloudPath;
    try {

        // const cloudinary = require('cloudinary').v2;
        // cloudinary.config({
        //     cloud_name: 'dj6wiq1dp',
        //     api_key: '375398319767898',
        //     api_secret: 'MjzqIDkn-Usb2F9JtLqVobEsYG4'
        // });

        // var uniqname = "";
        // uniqname = moment().format('MMMM Do YYYY, h:mm:ss a');
        // var c = await cloudinary.uploader.upload(fileinfo.path, { public_id: `kolourbox/bannerImage/${uniqname}`, tags: `kolourbox` }, function(err, result) {
        //     cloudPath = result.url;
        // });

        let addBanner = await new bannerSchema({
            bannerName: bannerName,
            bannerImage: fileinfo == undefined ? "" : fileinfo.path
        });
        if(addBanner != null){
            addBanner.save();
            res.status(200).json({ IsSuccess: true, Data: [addBanner], Message: "Banner Added !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/deleteBanner', async function(req, res, next){
    const{ bannerId } = req.body;
    try {
        let existBanner = await bannerSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(bannerId)
                }
            }
        ]);
        if(existBanner.length == 1){
            let deleteBanner = await bannerSchema.findByIdAndDelete(bannerId);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Banner Deleted !" });
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "Banner Not Deleted !" });
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllbanner', async function(req, res, next){
    try {
        let existBanner = await bannerSchema.aggregate([
            {
                $match: {}
            }
        ]);
        if(existBanner.length > 0){
            res.status(200).json({ IsSuccess: true,count: existBanner.length, Data: existBanner, Message: "Data Found !" });
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data Not Found !" });
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllCustomer', async function(req, res, next){
    try {
        let existCustomer = await customerSchema.aggregate([
            {
                $match: {}
            }
        ]);
        if(existCustomer.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existCustomer.length, Data: existCustomer, Message: "Customer's Data Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllDeliveredOrder', async function(req, res, next){
    try {
        let existOrder = await orderSchema.find({
            status: "delivered"
        })
        .populate({
            path: "orderContent.itemId"
        })
        .populate({
            path: "customerId"
        })
        .populate({
            path: "employeeId"
        })
        .populate({
            path: "godownBoy"
        })
        .sort({date: -1, time: -1});
        // let existOrder = await orderSchema.aggregate([
        //     {
        //         $match: {status: "delivered"}
        //     },
        //     {
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
        //             "customerId.mobileNo": 0,
        //             "customerId.companyName": 0,
        //             "customerId.address": 0,
        //         }
        //     },
        //     {
        //         $project: {
        //             "itemId.price": 0,
        //             "itemId.categoryId": 0,
        //         }
        //     },
        // ]);
        if(existOrder.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existOrder.length, Data: existOrder, Message: "Order's Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order's not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

// -------------------------------27-04-2021-----------------------
router.post('/getTodayOrder', async function(req, res, next){
    // let dateTimeIs = moment().format('DD/MM/YYYY,h:mm:ss a').split(',');
    // let dateIs = dateTimeIs[0];
    try {
        let existOrder = await orderSchema.find({status: "confirmed"})
        .populate({
            path: "orderContent.itemId"
        })
        .populate({
            path: "customerId"
        })
        .sort({date: -1, time: -1});
        
        // let existOrder = await orderSchema.aggregate([
        //     {
        //         $match: {
        //             $and: [
        //                 {status: "confirmed"},
        //                 {date: dateIs}
        //             ]
        //         }
        //     },
        //     {
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
        //             as: "ItemsInfo"
        //         }
        //     },
            // {
            //     $project: {
            //         customerId: 1,
            //         status: 1,
            //         orderContent: {
            //             ItemNo: "$ItemsInfo.itemNo",
            //             // ItemNo: "$ItemsInfo.price",
            //             ItemQTY: "$orderContent.itemQty"
            //         },
            //         // status: 1,
            //     }
            // },
        // ]);
        if(existOrder.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existOrder.length, Data: existOrder, Message: "Order's found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order's not found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getOrderList', async function(req, res, next){
    const{customerId, fromDate, toDate} = req.body;
    try {
        let existCustomer = await customerSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(customerId)
                }
            }
        ]);
        let sortDate = { date : -1, time : -1 };
        let ordersLogs;
        if(existCustomer.length == 1){
            if(fromDate != undefined && toDate != undefined && fromDate != null && toDate != null){
                let datesAre = generateDateList(fromDate,toDate);
                ordersLogs = await orderSchema.aggregate([
                    {
                        $match: {
                            $and: [
                                {customerId: mongoose.Types.ObjectId(customerId)},
                                {status: "delivered"},
                                {date: {
                                    $in: datesAre
                                }}
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
                            from: "items",
                            localField: "orderContent.itemId",
                            foreignField: "_id",
                            as: "itemId"
                        }
                    },
                    {
                        $project: {
                            "customerId.type": 0,
                            "customerId.companyName": 0,
                        }
                    },
                    {
                        $project: {
                            "itemId.price": 0,
                            "itemId.categoryId": 0,
                        }
                    },
                    {
                        $sort : sortDate
                    }
                ]);
            }else if(toDate && (fromDate == undefined || fromDate == "") ){
                ordersLogs = await orderSchema.aggregate([
                    {
                        $match: {
                            $and: [
                                {customerId: mongoose.Types.ObjectId(customerId)},
                                {status: "delivered"},
                                {date: toDate}
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
                            from: "items",
                            localField: "orderContent.itemId",
                            foreignField: "_id",
                            as: "itemId"
                        }
                    },
                    {
                        $project: {
                            "customerId.type": 0,
                            "customerId.companyName": 0,
                        }
                    },
                    {
                        $project: {
                            "itemId.price": 0,
                            "itemId.categoryId": 0,
                        }
                    },
                    {
                        $sort : sortDate
                    }
                ]);
            }else{
                ordersLogs = await orderSchema.aggregate([
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
                            from: "items",
                            localField: "orderContent.itemId",
                            foreignField: "_id",
                            as: "itemId"
                        }
                    },
                    {
                        $project: {
                            "customerId.type": 0,
                            "customerId.companyName": 0,
                        }
                    },
                    {
                        $project: {
                            "itemId.price": 0,
                            "itemId.categoryId": 0,
                        }
                    },
                    {
                        $sort : sortDate
                    }
                ]);
            }
            if(ordersLogs.length > 0){
                res.status(200).json({ IsSuccess : true,count : ordersLogs.length, Data : ordersLogs, Message : "orders found"});
            }else{
                res.status(200).json({ IsSuccess : true, Data : [], Message : "orders not found"});
            }
        }else{
            res.status(200).json({ IsSuccess : true, Data : [], Message : "No Customer found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/updateOrderStatus', async function(req, res, next){
    const{ orderId } = req.body;
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
                status: "delivered"
            }
            let updateStatus = await orderSchema.findByIdAndUpdate(orderId, updateIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Order Updated !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "Order Not Updated !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/addCustomer', async function(req, res, next){
    const{ name, mobileNo, companyName, address } = req.body;
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
                address: address
            });
            if(addCustomer != null){
                addCustomer.save();
                res.status(200).json({ IsSuccess: true, Data: [addCustomer], Message: "Customer Added Succesfully !"});
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/addEmployee', async function(req, res, next){
    const {name, mobileNo } = req.body;
    try {
        let existEmployee = await employeeSchema.aggregate([
            {
                $match: {
                    mobileNo: mobileNo
                }
            }
        ]);
        if(existEmployee.length == 1){
            res.status(200).json({ IsSuccess: true, Data: [], Message: "MobileNo. Already exists !"});
        }else{
            let addEmployee = await new employeeSchema({
                name: name,
                mobileNo: mobileNo
            });
            if(addEmployee != null){
                addEmployee.save();
                res.status(200).json({ IsSuccess: true, Data: [addEmployee], Message: "Employee Added Succesfully !"});
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/deleteEmployee', async function(req, res, next){
    const{ employeeId } = req.body;
    try {
        let existEmployee = await employeeSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(employeeId)
                }
            }
        ]);
        if(existEmployee.length == 1){
            let deleteEmployee = await employeeSchema.findByIdAndDelete(employeeId);
            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Employee Deleted !" });
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "Employee Not Deleted !" });
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllEmployee', async function(req, res, next){
    try {
        let existEmployee = await employeeSchema.aggregate([
            {
                $match: {}
            }
        ]);
        if(existEmployee.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existEmployee.length, Data: existEmployee, Message: "data found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "data not found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/addDeliveryBoy', async function(req, res, next){
    const{ orderId, employeeId } = req.body;
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
                employeeId: employeeId
            }
            let updateOrder = await orderSchema.findByIdAndUpdate(orderId, updateIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Delivery Boy Added"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order not found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/orderDeliveredByDeliveryBoy', async function(req, res, next){
    const{ employeeId, fromDate, toDate } = req.body;
    try {
        let existEmployee = await employeeSchema.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(employeeId)
                }
            }
        ]);
        let sortDate = { date : -1, time : -1 };
        let ordersLogs;
        if(existEmployee.length == 1){
            if(fromDate != undefined && toDate != undefined && fromDate != null && toDate != null){
                let datesAre = generateDateList(fromDate,toDate);
                ordersLogs = await orderSchema.find({ employeeId:employeeId, date: {$in: datesAre} })
                                            .populate({
                                                path: "employeeId"
                                            })
                                            .sort(sortDate);
            }else if(toDate && (fromDate == undefined || fromDate == "")){
                ordersLogs = await orderSchema.find({ employeeId:employeeId, date: toDate })
                                            .populate({
                                                path: "employeeId"
                                            })
                                            .sort(sortDate);
            }else{
                ordersLogs = await orderSchema.find({ employeeId:employeeId })
                                            .populate({
                                                path: "employeeId"
                                            })
                                            .sort(sortDate);
            }
            if(ordersLogs.length > 0){
                res.status(200).json({ IsSuccess : true,count : ordersLogs.length, Data : ordersLogs, Message : "orders found"});
            }else{
                res.status(200).json({ IsSuccess : true, Data : [], Message : "orders not found"});
            }
        }else{
            res.status(200).json({ IsSuccess : true, Data : [], Message : "employee not found"});
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
                    _id: mongoose.Types.ObjectId(orderId)
                }
            }
        ]);
        if(existOrder.length == 1){
            let statusIs = {
                status: "cancel"
            }
            let updateStatus = await orderSchema.findByIdAndUpdate(orderId, statusIs);
            existOrder = await orderSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId)
                    }
                }
            ]);
            res.status(200).json({ IsSuccess: true, Data: existOrder, Message: "Order Cancelld"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order Not Found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllCancelOrder', async function(req, res, next){
    try {
        let existOrder = await orderSchema.find({status: "cancel"})
        .populate({
            path: "orderContent.itemId"
        })
        .populate({
            path: "customerId"
        });
        if(existOrder.length > 0){
            res.status(200).json({ IsSuccess: true,Count: existOrder.length, Data: existOrder, Message: "Order's Found !"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Order's not Found !"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
});

router.post('/getAllOrder', async function(req, res, next){
    try {
        let existOrder = await orderSchema.find()
                                            .populate({
                                                path: "orderContent.itemId"
                                            })
                                            .populate({
                                                path: "customerId"
                                            })
                                            .populate({
                                                path: "employeeId"
                                            })
                                            .populate({
                                                path: "godownBoy"
                                            })
                                            .sort({date: -1, time: -1});

        if(existOrder.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existOrder.length, Data: existOrder, Message: "Data Found!" });
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data Not Found!" });
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });
    }
})

router.post('/listOfOrderPdf', async function(req, res, next){
    const{ customerId, fromDate, toDate } = req.body;
    const html = fs.readFileSync("template.html", "utf8");
    
    const filename = Math.random() + '_doc' + '.pdf';

    let existCustomer = await customerSchema.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(customerId)
            }
        }
    ]);
    // let sortDate = { date : -1, time : -1 };
    if(existCustomer.length == 1){
        if(fromDate != undefined && toDate != undefined && fromDate != null && toDate != null){
            let datesAre = generateDateList(fromDate,toDate);
            let ordersLogs = await orderSchema.aggregate([
                {
                    $match: {
                        $and: [
                            {customerId: mongoose.Types.ObjectId(customerId)},
                            {status: "delivered"},
                            {date: {
                                $in: datesAre
                            }}
                        ]    
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
                        "itemId.price": 0,
                        "itemId.categoryId": 0
                    }
                }
            ]);

            // console.log(ordersLogs);
            let orders = [];
            for(let i=0; i< ordersLogs.length; i++){
                // console.log(ordersLogs[i].orderContent);
                const order = {
                    date: ordersLogs[i].date,
                    time: ordersLogs[i].time,
                    billNo: ordersLogs[i].billNo,
                    orderContent: ordersLogs[i].orderContent,
                    quantity: ordersLogs[i].quantity,
                    status: ordersLogs[i].status,
                    itemId: ordersLogs[i].itemId
                }
                
                orders.push(order);
            }
            // console.log(orders);
            // ordersLogs.forEach(d => {
            //     const order = {
            //         date: d.date,
            //         time: d.time,
            //         billNo: d.billNo,
            //         orderContent: d.orderContent,
            //         quantity: d.quantity,
            //         status: d.status
            //     }
            //     orders.push(order);
            // });

            const document = {
                html: html,
                data: {
                    orderList: orders
                },
                path: 'pdfs/' + filename
            }

            pdf.create(document, options)
                .then(res => {
                    console.log(res);
                }).catch(error => {
                    console.log(error);
                });
            res.status(200).json({ IsSuccess: true, Data: document.path, Message: "Pdf File Add"})
        }else{
            res.status(200).json({ IsSuccess : true, Data : [], Message : "customer not found"});
        }
    }
});

router.post('/sendNotification', async function(req, res, next){
    const{ message, customerId, staffId } = req.body;
    let dateTimeIs = moment().format('DD/MM/YYYY,h:mm:ss a').split(',');
    let dateIs = dateTimeIs[0];
    let timeIs = dateTimeIs[1];
    try {
        if(customerId && staffId == ""){
            let existCustomer = await customerSchema.aggregate([
                {
                    $match :{ _id : mongoose.Types.ObjectId(customerId)}
                }
            ]);
            if(existCustomer.length == 1){
                let fcmTokenIs = existCustomer[0].fcmToken;
                let addNotification = await new notificationSchema({
                    date: dateIs,
                    time: timeIs,
                    message: message,
                    customerId : customerId
                });
                if(addNotification){
                    addNotification.save();
                    sendNotification(fcmTokenIs,message)
                    res.status(200).json({ IsSuccess: true, Data: [addNotification], Message: "Notification Send !!"});
                }
            }    
        }else{
            let fcm_list = [];
            let existCustomer = await customerSchema.aggregate([
                {
                    $match :{ _id : mongoose.Types.ObjectId(customerId)}
                }
            ]);
            let existStaff = await staffSchema.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(staffId)
                    }
                }
            ]);
            fcm_list.push(existCustomer[0].fcmToken);
            fcm_list.push(existStaff[0].fcmToken); 
            for(var i=0;i<fcm_list.length;i++){
                sendNotification(fcm_list[i],message)
            }
            if(staffId != ""){
                let addStaffNotification = await new notificationSchema({
                    date: dateIs,
                    time: timeIs,
                    message: message,
                    staffId : staffId
                });
                if(addStaffNotification){
                    addStaffNotification.save();
                    res.status(200).json({ IsSuccess: true, Data: [addStaffNotification], Message: "Notification Send !!"});
                }
            }else {
                let addCustomerNotification = await new notificationSchema({
                    date: dateIs,
                    time: timeIs,
                    message: message,
                    customerId : customerId
                });
                if(addCustomerNotification){
                    addCustomerNotification.save();
                    res.status(200).json({ IsSuccess: true, Data: [addCustomerNotification], Message: "Notification Send !!"});
                }
            }
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });  
    }
});

router.post('/getNotificationList', async function(req, res, next){
    try {
        let sortDate = { date : -1, time : -1 };
        let existNotification = await notificationSchema.aggregate([
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
                    $lookup: {
                        from: "staffs",
                        localField: "staffId",
                        foreignField: "_id",
                        as: "staffId"
                    }
                },
                {
                    $lookup: {
                        from: "customers",
                        localField: "staffId.customerId",
                        foreignField: "_id",
                        as: "customerId"
                    }
                },
                {
                    $project: {
                        "customerId.type": 0,
                        "customerId.fcmToken": 0,
                        "customerId.address": 0,
                    }
                },
                {
                    $sort : sortDate
                }
        ]);
        if(existNotification.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existNotification.length, Data: existNotification, Message: "Data Found"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data not Found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });  
    }
});

router.post('/getUserNotificationList', async function(req, res, next){
    const{ customerId, staffId } = req.body;
    try {
        let sortDate = { date : -1, time : -1 };
        let existUserNotification = await notificationSchema.aggregate([
            {
                $match: {
                    customerId: mongoose.Types.ObjectId(customerId)
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
                $project: {
                    "customerId.type": 0,
                    "customerId.fcmToken": 0,
                    "customerId.address": 0,
                }
            },
            {
                $sort : sortDate
            }
        ]);
        let existStaffNotification = await notificationSchema.aggregate([
            {
                $match: {
                    staffId: mongoose.Types.ObjectId(staffId)
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
                $project: {
                    "staffId.type": 0,
                    "staffId.fcmToken": 0,
                }
            },
            {
                $sort : sortDate
            }
        ]);
        if(existUserNotification.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existUserNotification.length, Data: existUserNotification, Message: "Data Found"});
        }else if(existStaffNotification.length > 0){
            res.status(200).json({ IsSuccess: true, Count: existStaffNotification.length, Data: existStaffNotification, Message: "Data Found"});
        }else{
            res.status(200).json({ IsSuccess: true, Data: [], Message: "Data not Found"});
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });  
    }
});

router.post('/sendNotificationtoAll', async function(req, res, next){
    const{ message } = req.body;
    try {
        let totalUser = [];
        let existCustomer = await customerSchema.aggregate([
            {
                $match: {}
            }
        ]);
        let existStaff = await staffSchema.aggregate([
            {
                $match: {}
            }
        ]);
        // let totalUser = existCustomer.length + existStaff.length;
        // console.log(totalUser);
        for(let i=0; i<existCustomer.length; i++){
            let customerfcm = existCustomer[i].fcmToken;
            totalUser.push(customerfcm);
        }
        for(let j=0; j<existStaff.length; j++){
            let staffFcm = existStaff[j].fcmToken;
            totalUser.push(staffFcm);
        }
        console.log(totalUser);
        if(totalUser.length > 0){
            for(let k=0; k<totalUser.length; k++){
                sendNotification(totalUser[k],message);
            }

            res.status(200).json({ IsSuccess: true, Data: 1, Message: "Notification Send to All !!" });
        }else{
            res.status(200).json({ IsSuccess: true, Data: 0, Message: "User FcmToken Not Found!" });
        }
    } catch (error) {
        res.status(500).json({ IsSuccess: false, Message: error.message });  
    }
})

async function sendNotification(fcmToken,message){
    let payload = {
        "to":fcmToken,
        "priority":"high",
        "data": {
            "sound": "surprise.mp3",
            "click_action": "FLUTTER_NOTIFICATION_CLICK"
        },
        "notification":{
            "body": message,
            "title": "Pending Order",
            "badge":1,
            "sound": "alert_tone.mp3",
            "content_available": true,
            "android_channel_id": "noti_push_app_1"
        }
    };
    
    let options = {
        'method': 'POST',
        'url': 'https://fcm.googleapis.com/fcm/send',
        'headers': {
            'authorization': 'key=AAAAujvXQy8:APA91bHo92E-vzP712bYI2cYaWZ2l_E4IPKDbCx1zxYDOWq-XuLBYdUgTdFLO2HrT_-f0jeIhYcfVxdOQec15FFUiqo7YzV5ohdqO3sz0FwSZhf1cwK7BYFKdGXvfO0qozqW-39-QhBO',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    };
    request(options, function (error, response , body) {
        // console.log("--------------------Sender--------------------");
        // let myJsonBody = JSON.stringify(body);
        // console.log(body);
        
        if (error) {
            console.log("==============================================================");
            console.log(error.message);
        } else {
            console.log("Sending Notification Error....!!!");
            console.log(response.body);
        }
    });
}

function generateDateList(start, end) {
    
    let date1 = start.split("/");
    let date2 = end.split("/");
    let fromDate = date1[2] + "-" + date1[1] + "-" + date1[0];
    let toDate = date2[2] + "-" + date2[1] + "-" + date2[0];
    
    fromDate = new Date(fromDate);
    toDate = new Date(toDate);
    
    for(var arr=[],dt=new Date(fromDate); dt<=toDate; dt.setDate(dt.getDate()+1)){
        // console.log(dt);
        let temp = moment(dt)
                        .tz("Asia/Calcutta")
                        .format('DD/MM/YYYY, h:mm:ss a')
                        .split(',')[0];
        arr.push(temp);
    }
    return arr;
};

// function sendpushnotification(device,message){
//     var restKey = "ZDFkNTgyYzEtMDllZC00YzJmLWI4MWUtMTY5ZWJmMjQ1OGVl";
//     var appId = "12ba0cff-4b99-41e2-a96e-6159946fe3cd";
//     request(
// 		{
// 			method:'POST',
// 			uri:'https://onesignal.com/api/v1/notifications',
// 			headers: {
// 				"authorization": "Basic "+restKey,
// 				"content-type": "application/json"
// 			},
// 			json: true,
// 			body:{
// 				'app_id': appId,
// 				'contents': {en: message},
// 				'include_player_ids': Array.isArray(device) ? device : [device]
// 			}
// 		},
// 		function(error, response, body) {
// 			if(!body.errors){
// 				console.log(body);
// 			}else{
// 				console.error('Error:', body.errors);
// 			}
			
// 		}
// 	);
// } 

module.exports = router;