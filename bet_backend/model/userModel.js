// import { string } from "joi"
import mongoose from "mongoose"
import { db } from "../db/index.js"

// import { stringify } from 'querystring'
// const moment = require('moment-timezone');
// const { string } = require('joi');



const userDetails = new mongoose.Schema({
    user_name: { type: String },
    country_code: { type: String },
    phone_no: { type: Number },
    password: { type: String },
    dob: { type: String },
    email: { type: String },
    status: { type: Number, default: 1 }, //1-> Active , 2-> suspended , 3 -> blocked
    country: { type: String, default: '' },
    profile_img: { type: String, default: null },
    email_otp: { type: String, default: null },
    temp_otp: { type: String, default: null },
    new_email_otp: { type: String, default: null },
    twofaEmailOtp: { type: Number, default: 0 },
    access_key: { type: Boolean, default: false },
    apiAccessOtp: { type: Number, default: true },
    temp_token: { type: Array },
    profile_otp: { type: String, default: '0' },
    app_finger_status: { type: String, default: '0' },
    app_face_status: { type: String, default: '0' },
    reason: { type: String, default: '' },
    type: { type: String, default: '' },
    parent_id: { type: String, default: '' },
    mobile_number: { type: Number, default: '' },
    modifiedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    issuspend: { type: Boolean, default: false },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    role: { type: Number }, // 3 => SuperMaster , 4 => Master, 5 => Agents , 6 => Users
    // is_address: { type: String, default: '0' },
    is_logged: { type: String, default: '0' },
    ipaddr: { type: String, default: '0' },
    location: { type: String, default: '0' },
    verifytoken: { type: String, default: '' },
    device_type: { type: String, default: '' },
    remember_token: { type: String, default: '' },
    profileimage: { type: String },
    deletedAt: { type: Date },
    authToken: { type: String },
    lastSeen: { type: String },
    ref_code: { type: String }, //refferal code
    ref_by: { type: String, default: null },  //refferal BY
    socket_id: { type: String, default: null },
    user_engagement_month_report: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    updatedBy: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    ReferralChilds: [
        { type: mongoose.Schema.Types.ObjectId, ref: "user" }
    ],
    notificationStatus: {
        ptop: { type: Number, default: 1 }, //1 enable 2 disable
        supportChat: { type: Number, default: 1 }
    },
    unique_id: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    escrowBalance: { type: Number, default: 0 },
    casino_block: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isLoginFirstTime: { type: Number, default: 1 }, //1-> Not Yet Login , 2->Login first time , 3 -> Logout First Time
    browser: String,
    os: String,
    version: String,
    favCoin: { type: Array },
    deposit_amt: { type: Number },
    withdraw_amt: { type: Number },
    isPasswordUpdatedByUpline: { type: Boolean },
    sportsList: {
        type: [{
            game: { type: String },
            status: { type: Boolean },
        }]
    }
}, { timestamps: true })
// userDetails.post(['save', 'findOneAndUpdate'], async function (doc, next) {
//     const contextService = await import('request-context');
//     const adminId = contextService.get('request:user');
//     if (adminId) {
//         let data = await user.findOne({ _id: doc._id });
//         let payload = {
//             updatedBy: adminId
//         }
//         if (data.createdBy == null) {
//             payload.createdBy = adminId;
//         }
//         await user.updateOne({ _id: doc._id }, payload);
//     }
//     next();
// })


const userLoginActivities = new mongoose.Schema({
    user_id: String,
    ipaddress: String,
    city: String,
    country: String,
    status: Boolean,
    type: String,
    browser: String,
    os: String,
    createdAt: { type: Date, default: Date.now }
})

const ipTracking = new mongoose.Schema({
    ip: { type: String },
    time: [],
    block: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

// const transactionHistorySchema = new mongoose.Schema({
//     sender_id: { type: String },
//     sender_name: { type: String },
//     receiver_id: { type: String },
//     receiver_name: { type: String },
//     deposite_by_upline: { type: Number, default: 0 },
//     deposite_to_downline: { type: Number, default: 0 },
//     withdraw_by_upline: { type: Number, default: 0 },
//     withdraw_from_downline: { type: Number, default: 0 },
//     type: { type: Number },
//     remaining_balance: { type: Number },
//     from_to: { type: Number },
//     remarks: { type: String },
//     user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
// }, { timestamps: true })


const transactionHistorySchema = new mongoose.Schema({
    sender_id: { type: String },
    sender_name: { type: String },
    sender_role: { type: Number },
    receiver_role: { type: Number },
    amount: { type: Number },
    receiver_id: { type: String },
    receiver_name: { type: String },
    type: { type: Number }, // 1 Deposite , 2 WithDrawel
    remaining_balance: { type: Number },
    from_to: { type: Number },
    remarks: { type: String },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
}, { timestamps: true })

const user = db.model('user', userDetails)
const userActivities = db.model('user_login', userLoginActivities)
const iptracker = db.model('iptracker', ipTracking)
const transactionHistory = db.model("transaction_history", transactionHistorySchema)
export {
    user,
    userActivities,
    iptracker,
    transactionHistory,
}
