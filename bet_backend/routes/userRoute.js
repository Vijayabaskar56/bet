import { Router } from "express";
import { userLogin, createUserWithRole, userLogOut, requestforgotpassword, requestforgotpasswordVerify, getOtpForChangePassword, verifyChangePasswordOtp, getprofileDetails, getUserLoginDetails, getUserBetLimit } from "../controller/userController.js";
import { ipcheck, checkAuthentication, userRoleCheck } from "../middleware/authentication.js";
import { getChatHistory } from "../controller/masterController.js";
import adminController from "../controller/adminController.js";

const router = new Router()

router.post('/login', ipcheck, userLogin)
router.post('/createUser', checkAuthentication, createUserWithRole)
router.post('/logout', checkAuthentication, userRoleCheck, userLogOut)
router.post('/getOtpForChangePassword', checkAuthentication, userRoleCheck, getOtpForChangePassword)
router.post('/verifyChangePasswordOtp', checkAuthentication, userRoleCheck, verifyChangePasswordOtp)
router.post('/requestforgotpassword', checkAuthentication, userRoleCheck, requestforgotpassword)
router.post('/requestforgotpasswordVerify', checkAuthentication, userRoleCheck, requestforgotpasswordVerify)
router.get('/profile', checkAuthentication, userRoleCheck, getprofileDetails)
router.get('/getUserLoginDetails', checkAuthentication, userRoleCheck, getUserLoginDetails)
router.get('/chat-history/:userId?', checkAuthentication, getChatHistory);
router.get("/betLimit", checkAuthentication, getUserBetLimit)
router.post('/getAllBanners', checkAuthentication, adminController.getAllBanners)
router.post('/transaction-history', checkAuthentication, adminController.transaction_his)
export default router
