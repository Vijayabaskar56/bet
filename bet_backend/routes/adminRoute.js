import { Router } from 'express'
import adminController from '../controller/adminController.js'
import { createUserWithRole } from '../controller/userController.js'
import { modelValidation } from '../middleware/Validation.js'
// const  authChecking = require('../middleware/authentication.js')
import { checkAuthentication } from "../middleware/authentication.js";
import { getAllUsers, getBalanceDetails, getChatHistory } from '../controller/masterController.js';
import { bannerImage } from '../middleware/multer.js';


const router = new Router()

router.post('/login', modelValidation.loginValid, adminController.adminLogin)
router.get('/profile', checkAuthentication, adminController.getProfile)
router.post('/subadmincreate', checkAuthentication, adminController.subadmincreate)
router.post('/createMaster', checkAuthentication, createUserWithRole) // created by sub admim
// router.post('/createUsers', createUserWithRole)
router.post('/create_admins_list', checkAuthentication, adminController.create_admins_list)
router.get("/getUser", checkAuthentication, getAllUsers)
router.post('/admin_Transaction', checkAuthentication, adminController.admin_Transaction)
router.get('/logOut', checkAuthentication, adminController.logOut)
router.get('/chat-history/:userId?', checkAuthentication, getChatHistory);
router.post('/transaction_his', checkAuthentication, adminController.transaction_his);
// router.post('/admin_balns_create', checkAuthentication,adminController.admin_balns_create);
router.get('/getBalanceDetails', checkAuthentication, getBalanceDetails)
// router.post('/list_admin',checkAuthentication, adminController.list_admin);
router.post('/user-bet-history', checkAuthentication, adminController.userBetHistory)

router.route('/messages')
    .get(checkAuthentication, adminController.getUnreadMessage)
    .put(checkAuthentication, adminController.updateUnreadMessage);


router.get('/getLimitSettings', checkAuthentication, adminController.getLimitSettings)
router.post('/betLimit', checkAuthentication, adminController.setMinandMaxBet)
router.post('/updateControls', checkAuthentication, adminController.updateControls)
//announcements and offerbanners
router.post('/bannerCreate', checkAuthentication, modelValidation.bannerCreate, bannerImage, adminController.createBanner)
router.put('/bannerUpdate', checkAuthentication, modelValidation.bannerUpdate, bannerImage, adminController.bannerUpdate)
router.put('/bannerDelete', checkAuthentication, modelValidation.bannerUpdate, bannerImage, adminController.bannerDelete)
router.get('/getActiveBanners', checkAuthentication, adminController.getActiveBanners)
router.post('/getAllBanners', checkAuthentication, adminController.getAllBanners)
router.post('/getSingleBanner', checkAuthentication, adminController.getSingleBanner)

export default router
