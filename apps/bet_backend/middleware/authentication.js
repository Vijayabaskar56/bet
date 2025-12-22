import { checking } from '../commonClass/mostCommonClass.js';
import { helper } from '../helper/helper.js';

import { user, iptracker } from '../model/userModel.js'
import { admin, siteSetting, suspendList } from '../model/adminModel.js';
import ipware from 'ipware'
import contextService from 'request-context';

const getIP = ipware().get_ip;
const checkAuthentication = async (req, res, next) => {
    // let browserDetails = req.useragent
    var ipInfo = getIP(req);
    if (ipInfo.clientIp.includes("::") || ipInfo.clientIp == "192.168.0.254") {
        ipInfo.clientIp = "49.207.185.190"
    }

    try {
        if (req.headers._token) {
            let tfa = false
            let path = req.route.path
            if (path == "/requestGoogleAuthentication" || path == "/userTwofaDetails" || path == "/verifyGoogleAuthentication" || path == "/requestmailauthentication" || path == "/verifytwofaotp" || path == "/twofaLostingRequest" || path == "/twofaLostImage") {
                tfa = true
            }
            const token = await checking.validToken('check', JSON.stringify(req.headers._token), null, null, tfa)
            let userDetails = await user.findOne({ _id: token?.id })
            let adminDetails = await admin.findOne({ _id: token?.id })
            if (userDetails && token) {
                req.params.token = token
                contextService.set('request:user', token.id);
                next()
            } else if (token && adminDetails) {
                req.params.token = token
                contextService.set('request:user', token.id);
                next()
            } else if (token == null) {
                res.status(498).send(await helper.jsonresponse(false, 'login.tokenexpired', null))
            }
            else {
                res.status(498).send(await helper.jsonresponse(false, 'login.unauthorizeduser', null))
            }
        }
        else {
            res.status(498).send(await helper.jsonresponse(false, 'token.tokennotfound', null))
        }

    } catch (error) {
        res.status(500).send(await helper.jsonresponse(null, error.message, null))
    }
}
const ipcheck = async (req, res, next) => {
    var ipInfo = getIP(req);
    const ip_address = await iptracker.findOne({ ip: ipInfo.clientIp })
    var current_time = new Date();
    if (ip_address) {
        const blocked_till = new Date(ip_address.updatedAt.setDate(ip_address.updatedAt.getDate() + 1)).toLocaleString();
        const diffInMs = new Date() - new Date(ip_address.updatedAt);
        const diffInHours = diffInMs / (1000 * 60 * 60);
        var start_time = new Date(current_time.getTime() - 60000);
        if (ip_address.block == false) {
            let siteSettings = await siteSetting.findOne()
            await iptracker.findOneAndUpdate({ ip: ipInfo.clientIp }, { $push: { time: current_time } }, { new: true })
            const data = await iptracker.aggregate([
                { $unwind: "$time" },
                { $match: { time: { $gte: start_time, $lte: current_time } } },
                { $group: { _id: null, count: { $sum: 1 } } }
            ]);
            if (data[0].count >= siteSettings?.ip_block_count) {
                await iptracker.findOneAndUpdate({ ip: ipInfo.clientIp }, { block: true }, { new: true })

                res.status(200).send(await helper.jsonresponse(null, `You Have Entered Incorrect Data For Multiple Times, We blocked Your IP For 24Hrs, Next Login Time ${blocked_till}`, null))
            } else if (data[0].count == (siteSettings.ip_block_count) - 1) {
                res.status(200).send(await helper.jsonresponse(null, `You Have Entered Incorrect Data For Multiple Times, We Are Going To Block Your Ip On Very Next Attempt`, null))
            } else {
                next()
            }

        } else {
            if (diffInHours <= 24) {
                res.status(200).send(await helper.jsonresponse(null, `You Have Entered Incorrect Data For Multiple Times, We blocked Your IP For 24Hrs, Next Login Time ${blocked_till}`, null))
            }
            else {
                await iptracker.findOneAndUpdate({ ip: ipInfo.clientIp }, { time: [current_time], block: false }, { new: true })
                next();
            }
        }
    } else {
        let data = {
            ip: ipInfo.clientIp,
            time: current_time
        }
        iptracker.create(data);
        next();
    }
}
// const apiAuthentication = async(req,res,next)=>{
//     // console.log(req.query,req.headers,req.body);
//     let respExist = false;
//     try {
//         if (req.headers.x_cex_apikey && req.query.signature) {
//                 let data = await accesskeys.findOne({apikey : req.headers.x_cex_apikey,isDeleted:false})
//                 if(data){
//                         let receivedStamp =Number(req.query.timestamp)
//                         if((!data.latestedEncryptionKey.key || !data.latestedEncryptionKey.timeStamp ) ||  (data.latestedEncryptionKey.key != req.query.signature && data.latestedEncryptionKey.timeStamp < receivedStamp)){


//                             let isValid = false;
//                             let queryObject = {
//                                 ...req.query
//                             }
//                             delete queryObject.signature;
//                             const rsaQueryString = new URLSearchParams(queryObject).toString();
//                             let receivedQueryString = { timestamp : receivedStamp};

//                             if(data.type && data.type=='rsa'){
//                                 const signature = Buffer.from(req.query.signature, 'base64'); // Convert your signature from base64 to a Buffer
//                                 isValid = crypto.verify('RSA-SHA256', rsaQueryString, data.rsaPubKey, signature);
//                             }
//                             else {
//                                 let decryptSecretkey = await decrypt(data.secretkey)

//                                 let newSignature = crypto
//                                 .createHmac('sha256', decryptSecretkey)
//                                 .update(new URLSearchParams(receivedQueryString).toString())
//                                 .digest('hex');
//                                 console.log(req.query.signature, newSignature);
//                                 if(req.query.signature == newSignature)
//                                     isValid = true
//                             }
//                             if(isValid){
//                                 await accesskeys.findOneAndUpdate({_id : data.id},{$set:{"latestedEncryptionKey.key":req.query.signature,"latestedEncryptionKey.timeStamp":receivedStamp}})
//                                 const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
//                                 let checkIp = process.env.NETWORK === "MAINNET" ? ip : ip.substring(7);
//                                 if(data.allowAllIps){
//                                     let token={ id : data.user_id }
//                                     req.params.token = token
//                                     next()
//                                 }else{
//                                     if(data.allowIps.some(e => e.ip == checkIp)){
//                                         let token={ id : data.user_id }
//                                         req.params.token = token
//                                        let updateData =  await accesskeys.findOneAndUpdate({_id : data.id,"allowIps.ip" :checkIp},{$inc:{"allowIps.$.count" : 1}})
//                                        if(updateData){
//                                             next()
//                                         }
//                                     }else{
//                                         throw new Error('accessKey.ipRestrict');
//                                     }
//                                 }
//                             }else{
//                                 throw new Error('accessKey.invalidSecretk');
//                             }
//                         }else{
//                             respExist = null;
//                             throw new Error('invalid Secrekey!');
//                         }
//                 }else{
//                     throw new Error('accessKey.invalidApik');
//                 }
//         }else{
//             throw new Error('accessKey.requiredKeys');
//         }
//     } catch (error) {
//         return res.status(200).send(await helper.jsonresponse(respExist,error.message,null))
//     }
// }
// const apiAccessAuthentication = (key)=>{
//     return async (req, res, next) => {
//     let data = await accesskeys.findOne({apikey : req.headers.x_cex_apikey , user_id: req.params.token.id})
//         if(data){
//             if(key == "read" && data.accessManageMent.readingData) next()
//             else if(key == "placeSpotTrades" && data.accessManageMent.placeSpotTrades) next()
//             else res.status(200).send(await helper.jsonresponse(null,'Access denied',null))
//         }else{
//             res.status(200).send(await helper.jsonresponse(false,'accessKey.invalidApik',null))
//         }
//     }
// }
// const checkApikeyAuthentication = async(req,res,next)=>{
//     try {
//         if (req.headers.x_cex_apikey) {
//             let data = await accesskeys.findOne({apikey : req.headers.x_cex_apikey,isDeleted:false})
//             if(data){
//                 const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
//                 let checkIp = process.env.NETWORK === "MAINNET" ? ip : ip.substring(7);
//                 if(data.allowAllIps){
//                     let token={ id : data.user_id }
//                     req.params.token = token
//                     req.params.apikeyAccess = true
//                     next()
//                 }else{
//                     if(data.allowIps.some(e => e.ip == checkIp)){
//                         let token={ id : data.user_id }
//                         req.params.token = token
//                         req.params.apikeyAccess = true
//                         let updateData =  await accesskeys.findOneAndUpdate({_id : data.id,"allowIps.ip" :checkIp},{$inc:{"allowIps.$.count" : 1}})
//                         if(updateData){
//                             next()
//                         }
//                     }else{
//                         throw new Error('accessKey.ipRestrict');
//                     }
//                 }
//             }else{
//                 throw new Error('accessKey.invalidApik');
//             }
//         }else{
//             throw new Error('accessKey.invalidApik');
//         }
//     } catch (error) {
//         return res.status(200).send(await helper.jsonresponse(false,error.message,null))
//     }
// }

const masterAgentRoleCheck = async (req, res, next) => {
    const token = req.params.token;
    if (token?.role === 3 || token?.role === 4 || token?.role === 5) {
        return next()
    }
    return res.status(200).send(await helper.jsonresponse(false, 'login.roleincorrect', null))
}

const userRoleCheck = async (req, res, next) => {
    const token = req.params.token;
    if (token?.role === 6) {
        return next()
    } else {
        return res.status(200).send(await helper.jsonresponse(false, 'login.roleincorrect', null))
    }
}

const suspendCheck = async (req, res, next) => {
    const token = req.params.token;
    const suspendData = await suspendList.findOne({ user_id: token.id, status: true })
    if (suspendData) {
        return res.status(200).send(await helper.jsonresponse(false, 'login.suspenduser', null))
    } else {
        return next();
    }
}

export {
    checkAuthentication, ipcheck, masterAgentRoleCheck, userRoleCheck, suspendCheck
}
