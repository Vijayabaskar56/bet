import nodemailer from 'nodemailer';
// import Binance from 'node-binance-api'
// const OKX = require('okx-api');
// import  responsejson from '../config/responsejson.json'
// es-lint ignore
import { Parser } from 'json2csv'
import XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const responsejson = require('../config/responsejson.json');


import path from 'path';
import Redis from 'ioredis';
import hbs from 'nodemailer-express-handlebars';
import jsonata from 'jsonata';
import { user, userActivities } from '../model/userModel.js';
import { admin } from '../model/adminModel.js';
import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import contextService from "request-context";
import translate from "translate";
import mongoose from 'mongoose';

// const jsonata = require('jsonata')
// const { user, userActivities, cryptoTransaction } = require('../model/userModel')
// const { newCyrptocurrencies } = require('../model/newCryptocurrencies')
// const { cryptoCurrencies, Commissions, TradePairs, MarketDatas } = require('../model/coinSettingModel')
// const { newTradePair } = require('../model/newTradePairModel')
// const { stat } = require('fs');
// const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
// const { s3 } = require("../middleware/multer.js");

// const axios = require('axios')
// const TronWeb = require('tronweb');
// const Web3 = require('web3');
// const { adminWallet, siteSetting, admin } = require('../model/adminModel');
// const { contractPair } = require('../model/futureContract')
// const mongoose = require('mongoose')
// const ObjectId = mongoose.Types.ObjectId;
// const serverio = require('../index')
// const { futureBuySell } = require('../model/buysellFutureTradeModel');
// const { marginTradePair } = require("../model/marginTradePairsModel")
// const CoinKey = require('coinkey');
// const bitcoin = require('bitcoinjs-lib');
// const validator = require('multicoin-address-validator')
// const io = require('socket.io-client')
// const kytHelper = require('./sumsubHelper')
// let socket = io.connect(process.env.SOCKETCLIENT);
// const ccxt = require('ccxt');
// const { newWallet } = require('../model/newWalletModel');
// const {liquidityProviders} = require('../model/arbitrageModel.js')
// const tradeTypeLimit = 'limit'
// const tradeTypeMarket = 'market'
// const buyStoplimit = 'buyStopLimit'
// const sellStoplimit = 'sellStopLimit'
// const buyStopMarket = 'buyStopMarket'
// const sellStopMarket = 'sellStopMarket'
// (async ()=>{
//     // emailCountSetRedis()
// })();
class helper {

    // static uploadImage = async (req) => {
    //     const form = formidable();
    //     // var date = new Date().toISOString()
    //     form.parse(req, async (_err, _fields, _file) => {
    //         // let filename = date + (path.extname(files.kyc.originalFilename));
    //         //     // if (!files.kyc) {
    //         //     //     res.status(400).send("No file uploaded");
    //         //     //     return;
    //         //     // }
    //         //     // try {
    //         //     //     return s3.putObject({
    //         //     //         Bucket: 'firebee',
    //         //     //         Key: filename,
    //         //     //         Body: fs.createReadStream(files.kyc.filepath),
    //         //     //         ACL: 'public-read'
    //         //     //     }, async () => res.status(200).send({ message: "File Uploaded", url: filename }))
    //         //     // } catch (err) {
    //         //     //     res.status(500).send(err)
    //         //     // }
    //     })

    // }
    static redisClient = new Redis(`${process.env.REDIS_URL}`);


    static paginate = (array, page_number) => {
        page_number = page_number ? page_number : 1;
        let page_size = process.env.PAGE_SIZE;
        // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
        return array.slice((page_number - 1) * page_size, page_number * page_size);
    }




    static findIndex = async (result, responseData) => {
        let start_index = result.indexOf(responseData[0]) + 1;
        let end_index = result.indexOf(responseData[responseData.length - 1]) + 1;
        return { start_index: start_index, end_index: end_index };
    }

    static filterResponseArray = async (field, array, param) => {
        return new Promise((resolve, reject) => {
            if (field, array, param) {
                var newArray = array.filter(function (el) {
                    return el[field] == (param == "zero" ? Number(0) : param);
                });
                if (newArray.length > 0) {
                    resolve(newArray)
                } else {
                    resolve([]);
                }
            } else {
                reject([]);
            }
        });
    }
    static filterArrayRegex = async (field, array, param) => {
        return new Promise((resolve, reject) => {
            if (field, array, param) {
                var newArray = array.filter(function (el) {
                    return el[field].match(new RegExp(param, 'i'));
                });
                resolve(newArray);
            } else {
                reject([]);
            }
        });
    }

    static sortAndSlice = async (array, sortby, limit, params) => {
        let result;
        let limits = limit ? limit : 5
        if (params == 3) {
            let data = array.filter((e) => e.commentLength == 0)
            result = data.slice(0, limits)
        } else {
            array.sort((a, b) => b[sortby] - a[sortby])
            result = array.slice(0, limits)
        }
        return result
    }


    static sendMail = async (params) => {

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            const transporter = nodemailer.createTransport({
                host: 'sg1-ts103.a2hosting.com',
                port: 465,
                auth: {
                    user: process.env.MAIL,
                    pass: process.env.PASS
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                },
            });

            const handlebarsOptions = {
                viewEngine: {
                    extName: ".handlebars",
                    partialsDir: path.resolve('./views'),
                    defaultLayout: false,
                },
                viewPath: path.resolve('./views'),
                extName: ".handlebars",
            }
            transporter.use('compile', hbs(handlebarsOptions))

            let info = {
                from: '"Betting" <Betting@betting.com>', // sender address
                to: params.email,
                subject: params.subject, // Subject line
                template: params.template,
                context: { params },
            };
            if (params.cc) {
                info.cc = params.cc
            }
            function mailSend() {
                transporter.sendMail(info, async (err,) => {
                    let responseData
                    if (!err) {
                        responseData = {
                            status: true,
                            message: 'commonmessage.mailsendsuccess'
                        }
                        resolve(responseData)
                    }
                    else {
                        responseData = {
                            status: false,
                            message: err.message
                        }
                        resolve(responseData)
                    }
                })
            }
            let obj = {
                from: info.from,
                to: info.to,
                subject: info.subject,
                sendingTime: new Date().toLocaleDateString() + "_" + new Date().toLocaleTimeString()
            }
            let redisData = JSON.parse(await helper.redisClient.get('NodeMail'))
            if (redisData) {
                let data = {}
                let currentDate = new Date().toLocaleDateString()
                if (redisData.date == currentDate) {

                    if (redisData.mailCount && (Number(redisData.mailCount) + 1) <= 1500) {
                        redisData.details.push(obj)
                        data = { date: redisData.date, mailCount: Number(redisData.mailCount) + 1, startTime: redisData.startTime, details: redisData.details }
                        helper.redisClient.set('NodeMail', JSON.stringify(data))
                        return mailSend()
                    } else {

                        var responseData = {
                            status: false,
                            message: "Today MailSend Limit Reached"
                        }
                        resolve(responseData)
                    }
                } else if (redisData.date != currentDate) {

                    data = { date: currentDate, mailCount: 1, startTime: new Date().toLocaleTimeString(), details: [obj] }
                    helper.redisClient.set('NodeMail', JSON.stringify(data))
                    mailSend()
                }
            } else {
                let arr = [obj]
                let data = { date: new Date().toLocaleDateString(), mailCount: 1, time: new Date().toLocaleTimeString(), details: arr }
                helper.redisClient.set('NodeMail', JSON.stringify(data))
                mailSend()
            }
        })




    }

    static withdrawApprovalMail = async (status, user_details, slug) => {
        let getParams = {
            'email': user_details?.email ? user_details?.email : user_details?.email_id,
            'username': user_details?.user_name ? user_details?.user_name : user_details?.name,
            'amount': status?.amount,
            'adress': status?.to_address,
            'slug': slug,
            'subject': 'withdraw Transaction ',
            'app_name': process.env.APP_NAME,
            'template': 'CoinWithdrawApproval',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
        }
        if (getParams) {
            return getParams
        }
        else {
            return false
        }

    }
    static withdrawRejectMail = async (status, user_details, slug) => {
        let getParams = {
            'email': user_details.email,
            'username': user_details.user_name,
            'amount': status.amount,
            'adress': status.from_address,
            'slug': slug,
            'subject': 'withdraw Transaction ',
            'app_name': process.env.APP_NAME,
            'template': 'CoinWithdrawReject',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
        }
        if (getParams) {
            return getParams
        }
        else {
            return false
        }

    }
    static adminFundShortage = async (matchList, mail) => {
        let getParams = {
            'email': mail.email,
            'username': 'Admin',
            'amount': matchList.cold_storage,
            'adress': '',
            'slug': matchList.slug,
            'sum': matchList.requested_balance,
            'remaining': matchList.admin_balance,
            'subject': 'Insufficient Balance ',
            'app_name': process.env.APP_NAME,
            'template': 'adminBalaceShortage',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
        }
        if (getParams) {
            return getParams
        }
        else {
            return false
        }

    }
    static adminColdStorage = async (matchList, mail) => {
        let getParams = {
            'email': mail.email,
            'username': 'Admin',
            'amount': matchList.cold_storage,
            'adress': '',
            'slug': matchList.slug,
            'sum': matchList.requested_balance,
            'remaining': matchList.admin_balance,
            'subject': 'ColdStorage Limit Reached ',
            'app_name': process.env.APP_NAME,
            'template': 'adminColdStorage',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
        }
        if (getParams) {
            return getParams
        }
        else {
            return false
        }

    }
    static adminWithoutColdStorage = async (matchList, mail) => {
        let getParams = {
            'email': mail.email,
            'username': 'Admin',
            'amount': matchList.cold_storage,
            'adress': '',
            'slug': matchList.slug,
            'sum': matchList.requested_balance,
            'remaining': matchList.admin_balance,
            'subject': 'Cold Storage Balance is Zero',
            'app_name': process.env.APP_NAME,
            'template': 'adminWithoutColdStorage',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
        }
        if (getParams) {
            return getParams
        }
        else {
            return false
        }

    }
    static formatResponse = async (params) => {
        try {
            if (params.error) {
                var responseData = {
                    success: params.success,
                    message: params.error,
                    data: null,
                    otp: params.otp
                }
                return responseData
            }
            else {
                let expression = jsonata(`$single(${params.message})`);
                let responseData = {
                    success: params.success,
                    message: (await expression.evaluate(responsejson)) ? await expression.evaluate(responsejson) : params.message,
                    data: params.data,
                    otp: params.otp
                }
                return responseData
            }

        }
        catch (error) {
            return error.message
        }

    }

    static jsonresponse = async (status, message, data, lang = null) => {
        // const contextService = require('request-context');


        const userLang = contextService.get('request:lang') || lang;
        let msg = message, success = status;
        if (success !== null) {
            try {
                let expression = jsonata(`$single(${message})`)
                msg = await expression.evaluate(responsejson)
                if (!msg) msg = message
            } catch (error) {
                // console.log(error)
            }
        }
        else {
            success = false;
        }

        let translation = await this.makeTranslate(msg, userLang)
        return {
            success,
            message: translation,
            data: data,
        }
    }

    static makeTranslate = async (message, lang) => {
        try {
            let translation = await translate(message, lang || 'en')
            return translation;
        } catch (error) {
            return error.message;
        }
    }

    static getuserDetails = async (id) => {
        // const token = { id: '667d0d912080b809b91f32d4' }
        let userData = await user.findOne({ _id: id })
        return userData
    }

    static getLastLogin = (userid, activity) => {
        if (activity == 'allactivities') {
            return new Promise((resolve) => {
                userActivities.find({ user_id: userid }).sort({ createdAt: -1 })
                    .then(async (userActivitiesDataResult) => {
                        let responseData = {
                            status: true,
                            data: userActivitiesDataResult
                        }
                        resolve(responseData)
                    })
                    .catch(async () => {
                        let responseData = {
                            status: false,
                            data: null
                        }
                        resolve(responseData)
                    })

            })
        }
        else {
            return new Promise((resolve) => {
                userActivities.findOne({ user_id: userid }).sort({ _id: -1 })
                    .then(async (userActivitiesDataResult) => {
                        let responseData = {
                            status: true,
                            data: userActivitiesDataResult
                        }
                        resolve(responseData)
                    })
                    .catch(async () => {
                        let responseData = {
                            status: false,
                            data: null
                        }
                        resolve(responseData)
                    })

            })
        }

    }


    static kycStatus = async (id) => {
        let userDeatils = await user.findOne({ _id: id })
        let responseData
        if (userDeatils.kyc_verify == 0) {
            responseData = {
                status: false,
                message: 'kyc.submityourrkyc',
                data: null

            }
        }
        else if (userDeatils.kyc_verify == 1) {
            responseData = {
                status: false,
                message: 'kyc.waitingadminapproval',
                data: null

            }
        }
        else if (userDeatils.kyc_verify == 2) {
            responseData = {
                status: true,
                message: 'kyc.kycalreadyapproved',
                data: userDeatils

            }
        }
        else if (userDeatils.kyc_verify == 3) {
            responseData = {
                status: false,
                message: 'kyc.kycrejected',
                data: null

            }
        }

        return responseData
    }

    static unLinkExistImage = async (key) => {
        const bucketParams = { Bucket: "firebee", Key: key };
        const data = await S3.send(new DeleteObjectCommand(bucketParams));
        if (data) {
            console.log("Exist image deleted successfully!");
            return data;
        } else {
            console.log("Oops! Failed to delete Exist image..!");
            return "Unlink failed";
        }
    }
    static tradeMail = async (email, subject, template, slug, tradeAmount, date, name, addId, orderuser) => {
        let getParams = {
            'subject': subject,
            'email': email,
            'app_name': process.env.APP_NAME,
            'template': template,
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'coin_slug': slug,
            'Amount': tradeAmount,
            'Date': date,
            'Name': name,
            "addID": addId,
            "orderuser": orderuser,
            'mail_footer': process.env.MAIL_FOOTER
        }
        if (getParams) {
            return getParams
        } else {
            return false
        }
    }
    static updateAdminId = async (db, docId) => {
        try {
            let contextService = await import('request-context');
            // var contextService = require('request-context');
            const adminId = contextService.get('request:user') || null;
            let docData = await db.findOne({ _id: docId }).lean();
            let payload = {
                updatedBy: adminId
            }
            if (!docData.createdBy) {
                payload.createdBy = adminId
            }

            await db.findOneAndUpdate({ _id: docId }, payload);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    static getAdminName = async (Id) => {
        try {
            const adminDet = await admin.findById(Id).then(res => res).catch(() => false);
            return adminDet ? adminDet.name : null
        } catch (error) {
            return error.message;
        }
    }

    static fixDigit = (num, digits = 5) => {
        let fixed = parseFloat(Number(num).toFixed(digits));
        return fixed;
    }
    static getUserRole = (role_no) => {
        const role = {
            1: 'Admin',
            2: 'Sub Admin',
            3: 'Master',
            4: 'Agent',
            5: 'User'
        }
        return role[role_no];
    }
    static getMongoType = (id) => {
        return mongoose.Types.ObjectId.createFromHexString(id)
    }

    static convertToCSV(data,) {
        try {
            const parser = new Parser();
            const date = new Date().toISOString()
            const csv = parser.parse(data);
            console.log(`Data has been written to ${date}`);
            return csv
        } catch (err) {
            console.error('Error converting to CSV:', err);
        }
    }

    static convertToExcel(data) {
        try {
            const date = new Date().toISOString()
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            const excelBuffer = XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            console.log(`Data has been written to ${date}`);
            return excelBuffer
        } catch (err) {
            console.error('Error converting to Excel:', err);
        }
    }

    static convertToPDF(data) {
        return new Promise((resolve) => {
            const doc = new PDFDocument();
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            doc.fontSize(25).text('This is a PDF content', 100, 100);

            if (data && Array.isArray(data)) {
                data.forEach((item, index) => {
                    doc.fontSize(12).text(`${index + 1}: ${item}`, 100, 150 + index * 20);
                });
            }

            doc.end();
        });
    }


    static async downloadRecord(type, data) {
        if (type === 'pdf') {
            return await this.convertToPDF(data)
        } else if (type === 'xlsx') {
            return await this.convertToExcel(data)
        } else if (type === 'csv') {
            return await this.convertToCSV(data)
        } throw new Error('Unsupported file type');
    }
}
export { helper }
