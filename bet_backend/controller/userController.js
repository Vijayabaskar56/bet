import { helper } from "../helper/helper.js";
import crypto from 'crypto';
import { user, userActivities, iptracker } from "../model/userModel.js"
import ipware from 'ipware'
import geoip from 'geoip-lite'
const getIP = ipware().get_ip;
import encryption from '../middleware/decryptEncrypt.js';
import { admin, siteSetting } from "../model/adminModel.js"
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { checking } from "../commonClass/mostCommonClass.js";
import moment from "moment-timezone";
import numberToWords from "number-to-words";


let current_time = new Date(); 1
let rateLimiter;
let obj = {};
let siteSettings;
const setBlockDuration = async () => {
    siteSettings = await siteSetting.findOne()
    obj.storeClient = helper.redisClient,
        obj.duration = 1 * 60,// Per 1 minutes
        obj.blockDuration = siteSettings?.logintime * 60//in minutes
    obj.points = siteSettings?.points
    rateLimiter = new RateLimiterRedis(obj)
}
setBlockDuration();


const userLogin = async (req, res) => {
    try {
        var ipInfo = getIP(req);
        if (ipInfo.clientIp.includes("::") || ipInfo.clientIp == "192.168.0.254") {
            ipInfo.clientIp = "49.207.185.190"
        }
        var geo = geoip.lookup(ipInfo.clientIp)
        if (!req.body.email) {
            return res.status(200).send(await helper.jsonresponse(false, 'login.accountnotfound', null, req.body.language));
        }
        const query = { $or: [{ email: req.body.email }, { user_name: req.body.email }], isDeleted: false };

        if (req?.body?.role) {
            query.role = req.body.role;
        } else {
            query.role = { $in: [3, 4, 5, 6] };
        }

        // const roleCondition =
        user.findOne(query).then(async (userData) => {
            if (userData) {
                if (userData.isBlocked == false) {
                    let decryptPassword = await encryption.decrypt(userData.password)
                    if (decryptPassword === req.body.password) {
                        await iptracker.findOneAndUpdate({ ip: ipInfo.clientIp }, { time: [current_time] });
                        const token = await checking.validToken('generate', null, userData._id, null, null, userData.role)
                        if (userData.authToken) {
                            user.updateOne({ _id: userData._id, authToken: token })
                        }
                        //Checking For Login First Time
                        if (userData.isLoginFirstTime == 1) {
                            await user.findOneAndUpdate({ _id: userData._id }, { $set: { isLoginFirstTime: 2 } })
                        }
                        let userActivitiesObj = {
                            user_id: userData._id,
                            ipaddress: ipInfo.clientIp,
                            city: geo.city,
                            country: geo.country,
                            browser: req.useragent.browser,
                            os: req.useragent.os,
                            createdAt: new Date(),
                            version: req.useragent.version,
                        }
                        await userActivities.create(userActivitiesObj)
                        res.status(200).send(await helper.jsonresponse(true, 'login.loginsuccess', { token, role: userData?.role, loginStatus: userData?.isLoginFirstTime }))
                    } else {
                        rateLimiter.consume(userData.email)
                            .then(async (data) => {
                                let userActivitiesObj = {
                                    user_id: userData._id,
                                    ipaddress: ipInfo.clientIp,
                                    city: geo.city,
                                    country: geo.country,
                                    type: req.body.type,
                                    browser: req.useragent.browser,
                                    os: req.useragent.os,
                                    createdAt: new Date(),
                                    version: req.useragent.version,
                                }
                                await userActivities.create(userActivitiesObj)
                                if (data.remainingPoints == 0) {
                                    res.status(401).send(await helper.jsonresponse(null, `You Have Entered Incorrect Username or Password, Your last attempt finished. We blocked credentials for ${siteSettings.logintime}  minutes`, null))
                                } else {
                                    res.status(401).send(await helper.jsonresponse(null, `You Have Entered Incorrect Username or Password, There Are ${numberToWords.toWords(data.remainingPoints)} Attempts Left`, null))
                                }
                            })
                            .catch(async (rejRes) => {
                                const secBeforeNext = Math.ceil(rejRes.msBeforeNext / 1000) || 1;
                                res.set('Retry-After', String(secBeforeNext));
                                res.status(403).send(await helper.jsonresponse(null, `Sorry! As You Have  Entered Invalid Credentials Multiple Time Please Try Again After ${secBeforeNext} seconds`, null))
                            });
                    }
                    // } else {
                    //     res.status(200).send(await helper.jsonresponse(false, 'login.suspenduser', null, req.body.language))
                    // }
                } else {
                    res.status(403).send(await helper.jsonresponse(false, 'login.loginblockeduser', { isBlocked: true }, req.body.language))
                }
            } else {
                const isUserDeleted = await user.findOne({ $and: [{ isDeleted: true }, { $or: [{ email: req.body.email }, { user_name: req.body.email }] }] })
                if (isUserDeleted) {
                    return res.status(401).send(await helper.jsonresponse(false, 'login.usernomore', null))
                } else {
                    return res.status(401).send(await helper.jsonresponse(false, 'login.accountnotfound', null, req.body.language))
                }

            }
        })
            .catch(async (userDataError) => {
                res.status(500).send(await helper.jsonresponse(null, userDataError.message, null))
            })
    } catch (error) {
        res.status(500).send(await helper.jsonresponse(null, error.message, null))
    }

}


const userLogOut = async (req, res) => {
    let token = req.params.token
    let last_seen = moment(new Date()).format('LLL')
    user.findOne({ _id: token.id }).then(async (userData) => {
        if (userData) {
            //Inorder to update first Logout Scenario
            if (userData.isLoginFirstTime == 2 || userData.isLoginFirstTime == 1) {
                await user.findOneAndUpdate({ _id: token.id }, { $set: { isLoginFirstTime: 3 } })
            }

            // //Unsubscribe Push Notification service
            await user.findOneAndUpdate({ _id: token.id }, { $set: { authToken: null, lastSeen: last_seen } })
            // await alertSubscription.deleteMany({ user_id: token.id }).exec();

            return res.status(200).send(await helper.jsonresponse(true, 'logout.message', null))
        } else {
            res.status(500).send(await helper.jsonresponse(false, 'commonmessage.tryagainlater', null))
        }

    })

}

const createUserWithRole = async (req, res) => {
    const { user_id } = req.body
    const token = req.params.token
    try {
        if ((!req.body.password) || (!req.body.email) || (!req.body.user_name)) {
            return await helper.jsonresponse(false, "register.missingparameters", null)
        }
        const creator = await user.findById(user_id ?? token.id);
        const isAdmin = await admin.findById(user_id ?? token.id)
        let existsUser = await user.findOne({ $and: [{ isDeleted: false }, { $or: [{ email: req.body.email }, { user_name: req.body.user_name }] }] });
        if (!existsUser) {
            if (creator?.role === 3) { // Super Master
                // super master can create master and agent
                const responseData = await createUserhelper(req, creator?._id, req.body.role)
                // if (responseData) {
                //     const isMailSend = await sendMailtoTheUser(req.body.email, req.body.password, req.body.user_name, creator)
                //     if (isMailSend) {
                res.status(200).send(await helper.jsonresponse(true, 'register.success', responseData))
                //     }
                // }
            } else if (creator?.role === 4) { // master
                // master can create agent
                const responseData = await createUserhelper(req, creator?._id, 5)
                // const isMailSend = await sendMailtoTheUser(req.body.email, req.body.password, req.body.user_name, creator)
                // if (isMailSend) {
                res.status(200).send(await helper.jsonresponse(true, 'register.success', responseData))
                // }
            } else if (creator?.role === 5) { // Agent
                // agent can create user
                const responseData = await createUserhelper(req, creator?._id, 6)
                // const isMailSend = await sendMailtoTheUser(req.body.email, req.body.password, req.body.user_name, creator)
                // if (isMailSend) {
                res.status(200).send(await helper.jsonresponse(true, 'register.success', responseData))
                // }
            } else if (isAdmin && isAdmin.role === 2) { // Sub Admin
                // sub admin can create super master, master, agent
                const responseData = await createUserhelper(req, isAdmin?._id, req.body.role)
                // const isMailSend = await sendMailtoTheUser(req.body.email, req.body.password, req.body.user_name, isAdmin)
                // if (isMailSend) {
                res.status(200).send(await helper.jsonresponse(true, 'register.success', responseData))
                // }
            } else {
                res.status(200).send(await helper.jsonresponse(false, "register.notpremitted", null));
            }
        } else {
            let result;
            if (existsUser?.user_name && existsUser?.user_name == req.body?.user_name) {
                result = await helper.jsonresponse(false, "register.usernameexists", null)
                result.message = req.body.user_name + ' ' + result.message;
            } else {
                result = await helper.jsonresponse(false, "register.useralreadyexists", null)
                result.message = req.body.email + ' ' + result.message;
            }
            res.status(200).send(result);
        }
    } catch (e) {
        console.log(e, "e");
        res.status(200).send(await helper.jsonresponse(null, e.message, null));
    }
}

const requestforgotpassword = async (req, res) => {
    try {
        user.findOne({ email: req.body.email, isDeleted: false })
            .then(async (userData) => {
                if (userData) {
                    let eyncPassword = await encryption.decrypt(userData?.password)
                    if (!eyncPassword || req.body.password != eyncPassword) return res.status(200).send(await helper.jsonresponse(false, 'resendmailotp.incorrectPassword', null))

                    let otp = Math.floor(100000 + Math.random() * 900000)
                    var getParams = {
                        'email': req.body.email,
                        'name': await userData.user_name,
                        'subject': 'Reset Password OTP',
                        'otp': otp,
                        'app_name': process.env.APP_NAME,
                        'template': 'forgotPassword',
                        'support_mail': process.env.SUPPORTMAIL,
                        'image_path': process.env.IMAGEURL,
                        'mail_footer': process.env.MAIL_FOOTER

                    }
                    var sendmail = await helper.sendMail(getParams)
                    if (sendmail.status == true) {
                        const updateData = { profile_otp: otp, modifiedAt: new Date() };
                        await user.findOneAndUpdate({ $and: [{ isDeleted: false }, { email: req.body.email }] }, updateData)
                        const email = req.body.email
                        let responseData =
                        {
                            email: email
                        }
                        res.status(200).send(await helper.jsonresponse(true, 'forgotpassword.forgototpmailsuccess', responseData))
                    }
                    else {

                        res.status(200).send(await helper.jsonresponse(false, 'resendmailotp.mailnotsend', null))
                    }
                }
                else {
                    res.status(200).send(await helper.jsonresponse(false, 'accountverify.usernotexists', null))
                }
            })
            .catch(async (userDataError) => {
                res.status(200).send(await helper.jsonresponse(null, userDataError.message, null))
            })
    } catch (error) {
        res.status(500).send(await helper.jsonresponse(null, error.message, null))
    }
}


const requestforgotpasswordVerify = async (req, res) => {
    try {
        user.findOne({ email: req.body.email, isDeleted: false })
            .then(async (userData) => {
                if (userData) {
                    // let eyncPassword = await encryption.decrypt(userData?.password)
                    // if (!eyncPassword || req.body.password != eyncPassword) return res.status(200).send(await helper.jsonresponse(false, 'resendmailotp.incorrectPassword', null))

                    let otp = Math.floor(100000 + Math.random() * 900000)
                    var getParams = {
                        'email': req.body.email,
                        'name': await userData.user_name,
                        'subject': 'Reset Password OTP',
                        'otp': otp,
                        'app_name': process.env.APP_NAME,
                        'template': 'forgotPassword',
                        'support_mail': process.env.SUPPORTMAIL,
                        'image_path': process.env.IMAGEURL,
                        'mail_footer': process.env.MAIL_FOOTER

                    }
                    var sendmail = await helper.sendMail(getParams)
                    if (sendmail.status == true) {
                        const updateData = { profile_otp: otp, modifiedAt: new Date() };
                        await user.findOneAndUpdate({ email: req.body.email }, updateData)
                        const email = req.body.email
                        let responseData =
                        {
                            //otp : otp,
                            email: email,
                            // entryToaster: 'forgotpassword.entryToaster'
                        }
                        res.status(200).send(await helper.jsonresponse(true, 'forgotpassword.forgototpmailsuccess', responseData))
                    }
                    else {
                        res.status(200).send(await helper.jsonresponse(false, 'resendmailotp.mailnotsend', null))
                    }
                }
                else {
                    res.status(200).send(await helper.jsonresponse(false, 'Enter Valid email', null))
                }
            })
            .catch(async (userDataError) => {
                res.status(200).send(await helper.jsonresponse(null, userDataError.message, null))
            })
    } catch (error) {
        res.status(500).send(await helper.jsonresponse(null, error.message, null))
    }
}

const createUserhelper = async (req, creatorId, role) => {
    let ipInfo = getIP(req);
    if (ipInfo.clientIp.includes("::") || ipInfo.clientIp == "192.168.0.254") {
        ipInfo.clientIp = "49.207.185.190"
    }
    let geo = geoip.lookup(ipInfo.clientIp)
    req.body.device_type = req.headers['user-agent']
    req.body.password = await encryption.encrypt(req.body.password)
    let createData = {
        user_name: req.body.user_name,
        email: req.body.email,
        password: req.body.password,
        createdBy: creatorId,
        unique_id: "CLT-" + crypto.randomUUID(),
        browser: req.useragent.browser,
        os: req.useragent.os,
        ipaddr: ipInfo.clientIp,
        version: req.useragent.version,
        role: role,
    }
    const userDetailsCreate = await user.create(createData)
    if (userDetailsCreate) {
        if (ipInfo.clientIp.includes("::") || ipInfo.clientIp == "192.168.0.254") {
            ipInfo.clientIp = "49.207.185.190"
        }
        let userActivitiesObj = {
            user_id: userDetailsCreate._id,
            ipaddress: ipInfo.clientIp,
            city: geo.city,
            country: geo.country,
            browser: req.useragent.browser,
            os: req.useragent.os,
            createdAt: new Date()
        }
        await userActivities.create(userActivitiesObj)
        return userDetailsCreate;
    }
}

const sendMailtoTheUser = async (email, user_name, password, creator) => {
    var getParams = {
        'email': email,
        'username': user_name,
        'password': password,
        'subject': `Hi, I am  your ${helper.getUserRole(creator?.role)},${creator.user_name ?? creator?.name},`,
        'app_name': process.env.APP_NAME,
        'template': 'mail_verification',
        'support_mail': process.env.SUPPORTMAIL,
        'image_path': process.env.IMAGEURL,
        'mail_footer': process.env.MAIL_FOOTER
    }
    return await helper.sendMail(getParams)
}

const getOtpForChangePassword = async (req, res) => {
    try {
        const token = req.params.token
        const userDetails = await user.findById(token.id)
        if (!userDetails) throw new Error("commonmessage.norecordsfound")
        const decryptedoldPassword = await encryption.decrypt(userDetails.password)
        if (userDetails.isLoginFirstTime == 2) {
            if (decryptedoldPassword == req.body.oldPassword) {
                req.body.newPassword = await encryption.encrypt(req.body.newPassword)
                await user.findOneAndUpdate({ _id: token.id }, { isLoginFirstTime: 3, password: req.body.newPassword })
                return res.status(200).send(await helper.jsonresponse(true, 'forgotpassword.paswordchangesuccess', null))
            } else {
                return res.status(200).send(await helper.jsonresponse(false, 'commonmessage.incorrectPassword', null))
            }
        }

        if (decryptedoldPassword != req.body.oldPassword) throw new Error('commonmessage.incorrectPassword')
        const otp = Math.floor(100000 + Math.random() * 900000)
        const getParams = {
            'subject': 'change password',
            'email': userDetails.email,
            'otp': otp,
            'app_name': process.env.APP_NAME,
            'template': 'resendOTP',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
        }
        let sendMail = await helper.sendMail(getParams)
        if (sendMail.status == true) {
            await user.findOneAndUpdate({ _id: userDetails._id }, { $set: { email_otp: otp } })
            res.status(200).send(await helper.jsonresponse(true, 'chagedpassword.otpmailsuccess', { email: userDetails.email }))
        } else {
            console.log('Issue in sending mail')
        }
    }
    catch (error) {
        res.status(500).send(await helper.jsonresponse(null, error.message, null))
    }
}

const verifyChangePasswordOtp = async (req, res) => {
    try {
        const token = req.params.token
        const userDetails = await user.findOne({ _id: token.id })
        if (userDetails.email_otp == req.body.otp) {
            req.body.newPassword = await encryption.encrypt(req.body.newPassword)
            const updateUserPassword = await user.findOneAndUpdate({ _id: token.id }, { $set: { password: req.body.newPassword } })
            if (updateUserPassword) res.status(200).send(await helper.jsonresponse(true, 'forgotpassword.paswordchangesuccess', null))
        } else {
            res.status(200).send(await helper.jsonresponse(false, 'forgotpassword.invalidotp', null))
        }
    }
    catch (error) {
        res.status(500).send(await helper.jsonresponse(null, error.message, null))
    }
}

const getprofileDetails = async (req, res) => {
    try {
        const token = req.params.token
        const particularUser = await user.findOne({ _id: token.id })
        if (!particularUser) throw new Error('commonmessage.norecordsfound')
        const userDetails = await user.aggregate([
            {
                $match:
                    { _id: particularUser._id }
            },
            {
                $project: {
                    user_name: 1,
                    email: 1,
                    usersDetails: 1,
                    kyc_verify: 1,
                    kyc_level: 1,
                    mobile_number: 1,
                    // issuspend:1,
                    status: 1,
                    lastSeen: 1,
                    profile_img: 1,
                    balance: 1,
                    availableBalance: 1,
                    escrowBalance: 1,
                    address: 1,
                    city: 1,
                }
            }
        ])
        res.status(200).send(await helper.jsonresponse(true, 'profile.profilefetchsuccess', userDetails))
    }
    catch (error) {
        res.status(500).send(await helper.jsonresponse(false, error.message, null))
    }
}

const getUserLoginDetails = async (req, res) => {
    try {
        const token = req.params.token
        const page = req.query.page
        const getLoginDet = await userActivities.find({ user_id: token.id }).sort({ createdAt: -1 }).skip(0).limit(15)
        if (!getLoginDet.length) throw new Error('commonmessage.norecordsfound')
        const result = await helper.paginate(getLoginDet, page)
        res.status(200).send(await helper.jsonresponse(true, 'commonmessage.detailsfetchsuccess', { result, totalCount: getLoginDet.length }))
    }
    catch (error) {
        res.status(500).send(await helper.jsonresponse(false, error.message, null))
    }
}

const updateUserPassword = async (req, res) => {
    try {
        const user_id = req.body.user_id
        const token = req.params.token
        const userDetails = await user.findById(user_id)
        if (token?.role > userDetails?.role) {
            throw new Error("login.roleincorrect")
        }
        if (!userDetails) throw new Error("commonmessage.norecordsfound")
        const decryptedoldPassword = await encryption.decrypt(userDetails.password)
        if (decryptedoldPassword == req.body.oldPassword) {
            req.body.newPassword = await encryption.encrypt(req.body.newPassword)
            await user.findOneAndUpdate({ _id: user_id }, { isPasswordUpdatedByUpline: true, password: req.body.newPassword })
            return res.status(200).send(await helper.jsonresponse(true, 'forgotpassword.paswordchangesuccess', null))
        } else {
            return res.status(200).send(await helper.jsonresponse(false, 'commonmessage.incorrectPassword', null))
        }
    } catch (error) {
        res.status(500).send(await helper.jsonresponse(false, error.message, null))
    }
}

const getUserBetLimit = async (req, res) => {
    try {
        const updatedSettings = await siteSetting.findOne({});
        if (updatedSettings) {
            return res.send(await helper.jsonresponse(false, 'betting.minandmaxupdated', updatedSettings))
        }
        console.log("🚀 ~ :503 ~ getUserBetLimit ~ updatedSettings:", updatedSettings)
        return res.send(await helper.jsonresponse(false, 'commonmessage.recordNotFound', null))

    } catch (error) {
        res.status(500).send(await helper.jsonresponse(false, error.message, null))
    }
}

export {
    userLogin,
    createUserWithRole,
    userLogOut,
    getOtpForChangePassword,
    verifyChangePasswordOtp,
    requestforgotpassword,
    requestforgotpasswordVerify,
    getprofileDetails,
    getUserLoginDetails,
    updateUserPassword,
    getUserBetLimit
}
