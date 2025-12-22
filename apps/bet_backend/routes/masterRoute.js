import { Router } from "express"
import { checkAuthentication, ipcheck, masterAgentRoleCheck } from "../middleware/authentication.js"
import { createUserWithRole, getOtpForChangePassword, requestforgotpassword, requestforgotpasswordVerify, updateUserPassword, userLogin, userLogOut, verifyChangePasswordOtp } from "../controller/userController.js"
import { getAllUser, getAllUsers, getBalanceDetails, getChatHistory, getDashboardData, getSportsList, getSubUser, getSuspendAndBlockLists, getUnreadMessage, getUserBalance, updateSportsList, updateUnreadMessage, updateUserStatus } from "../controller/masterController.js"
import adminController from "../controller/adminController.js"

const router = new Router()

router.post('/login', ipcheck, userLogin)
router.post('/create', checkAuthentication, masterAgentRoleCheck, createUserWithRole)
router.post('/requestforgotpassword', masterAgentRoleCheck, requestforgotpassword)
router.post('/requestforgotpasswordVerify', masterAgentRoleCheck, requestforgotpasswordVerify)
router.get('/logout', checkAuthentication, userLogOut)

// User List
router.get('/getUser', checkAuthentication, masterAgentRoleCheck, getAllUsers)
router.get('/getSubUser', checkAuthentication, masterAgentRoleCheck, getSubUser)
router.post('/getDashboardData', checkAuthentication, masterAgentRoleCheck, getDashboardData)
// router.get('/getReferalUser', checkAuthentication, masterAgentRoleCheck)
// Block and Suspend
router.post('/updateUserStatus', checkAuthentication, masterAgentRoleCheck, updateUserStatus)
router.post("/getSuspendAndBlockList", checkAuthentication, masterAgentRoleCheck, getSuspendAndBlockLists)


// Password Change
router.post('/getOtpForChangePassword', checkAuthentication, masterAgentRoleCheck, getOtpForChangePassword)
router.post('/verifyChangePasswordOtp', checkAuthentication, masterAgentRoleCheck, verifyChangePasswordOtp)
// router.get('/profile',checkAuthentication,masterAgentRoleCheck,getprofileDetails)
router.post('/transaction', checkAuthentication, adminController.admin_Transaction)
router.post("/updateUserPassword", checkAuthentication, masterAgentRoleCheck, updateUserPassword)
router.route('/messages')
    .get(checkAuthentication, masterAgentRoleCheck, getUnreadMessage)
    .put(checkAuthentication, masterAgentRoleCheck, updateUnreadMessage);
router.get('/chat-history/:userId?', checkAuthentication, getChatHistory);

// Balance
router.get('/getBalanceDetails', checkAuthentication, getBalanceDetails);
router.get('/getAllUser', checkAuthentication, masterAgentRoleCheck, getAllUser)
router.get("/getUserBalance", checkAuthentication, masterAgentRoleCheck, getUserBalance)
router.post('/transactionHistory', checkAuthentication, masterAgentRoleCheck, adminController.transaction_his);
// Sport Listing
router.get('/getSportList', checkAuthentication, masterAgentRoleCheck, getSportsList)
router.post('/updateSportList', checkAuthentication, masterAgentRoleCheck, updateSportsList)

// router.get('/chat-history/:userId?', checkAuthentication, getChatHistory);
export default router
