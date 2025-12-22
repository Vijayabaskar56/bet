import mongoose from "mongoose";
import { db } from "../db/index.js";
const adminDetails = new mongoose.Schema({
    email_id: { type: String },
    name: { type: String },
    password: { type: String },
    random_id: { type: String },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    role: { type: Number, require: true },
    balance: { type: Number, default: 0 },
    escrowBalance: { type: Number, default: 0 },
    tfa_secretKey: { type: String, default: null },
    tfa_status: { type: Boolean, default: false },
    authentic_status: { type: Boolean, default: false },
    is_verify: { type: Boolean, default: false },
    email_otp: { type: String, default: null },
    temp_otp: { type: String, default: null },
    authToken: { type: String, default: null },
    twofa_status: { type: String, default: 0 },
    qrCode: { type: String, default: null },
    temp_token: { type: Array },
    socket_id: { type: String, default: null },
    loginActivites: { type: Number }, //1 active // 2 inactive
    withdrawOtp: { type: Number, default: "" },
    isDeleted: { type: Boolean, default: false },
    admin_id: { type: String, default: null },
    deposit_amt: { type: Number },
    withdraw_amt: { type: Number },
    first_Login: { type: Number, default: 1 },
    chats: [
        {
            sender_id: { type: String },
            receiver_id: { type: Array },
            message: { type: String },
            image: { type: String },
        },
    ],
    sportsList: {
        type: [{
            game: { type: String },
            status: { type: Boolean },
        }]
    },

});

const sub_adminDetails = new mongoose.Schema(
    {
        email_id: { type: String },
        name: { type: String },
        password: { type: String },
        role: { type: String, default: "admin" },
        admin_id: { type: String },
    },
    { timestamps: true }
);
const siteSettingsDetails = new mongoose.Schema(
    {
        decimal: { type: Number },
        image_lmt: { type: Number },
        logintime: { type: Number },
        points: { type: Number },
        ip_block_count: { type: Number },
        spot: { type: Boolean },
        p2p: { type: Boolean },
        ico: { type: Boolean },
        otc: { type: Boolean },
        futuretrading: { type: Boolean },
        margintrading: { type: Boolean },
        launchpad: { type: Boolean },
        dex: { type: Boolean },
        nft: { type: Boolean },
        defi: { type: Boolean },
        arbitrageBot: { type: Boolean },
        match: {
            maxBet: { type: Number, default: 0 },
            minBet: { type: Number, default: 0 }
        },
        bookmark: {
            maxBet: { type: Number, default: 0 },
            minBet: { type: Number, default: 0 }
        },
        fancy: {
            maxBet: { type: Number, default: 0 },
            minBet: { type: Number, default: 0 }
        },
        controls: [
            {
                name: { type: String },
                sportid: { type: Number },
                status: { type: Boolean },
            }
        ]
    },
    { timestamps: true }
);

const suspendUsersInformation = new mongoose.Schema(
    {
        user_id: { type: String },
        status: { type: Boolean },
    },
    { timestamps: true }
);

const blockedUsersInformation = new mongoose.Schema(
    {
        user_id: { type: String },
        status: { type: Boolean },
    },
    { timestamps: true }
);

const supportChat = new mongoose.Schema(
    {
        sender_id: { type: String },
        sender_name: { type: String },
        receiver_id: { type: String },
        receiver_name: { type: String },
        sender_role: { type: Number },
        chats: [
            {
                sender_id: { type: String },
                receiver_id: { type: String },
                message: { type: String },
                image: { type: String },
                type: { type: Number },
                time: { type: String },
                readedAt: { type: Date, default: null },
                msgFrom: { type: String }
            },
        ],
    },
    { timestamps: true }
);



//Announcement and offer banner management
const offerAnnouncements = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    banner_image: { type: String },
}, { timestamps: true })


const admin = db.model("admin", adminDetails);
const subadmin = db.model("subadmin", sub_adminDetails);
const siteSetting = db.model("siteSetting", siteSettingsDetails);
const suspendList = db.model("suspend_list", suspendUsersInformation);
const blockedList = db.model("blocked_list", blockedUsersInformation);
const supportchat = db.model("supportChat", supportChat);
const banners = db.model('banner', offerAnnouncements)

export { admin, subadmin, siteSetting, suspendList, blockedList, supportchat, banners };
