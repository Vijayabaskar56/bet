import { Router } from "express";
import adminController from "../controller/adminController.js";
import bettingController from "../controller/bettingController.js";
import { checkAuthentication } from "../middleware/authentication.js";
import { modelValidation } from "../middleware/Validation.js";

const router = new Router()

router.get('/landing-data', checkAuthentication, bettingController.landingData)
router.get('/liveMatches', checkAuthentication, bettingController.liveMatches)
router.get('/upcomingEvents', checkAuthentication, bettingController.upcomingEvents)
router.get('/matchOdds/:sportId/:matchId', checkAuthentication, bettingController.matchOdds)

router.post('/place-bet', checkAuthentication, modelValidation.placeBet, bettingController.placeBet)
router.delete('/cancel-bet/:betId', checkAuthentication, bettingController.cancelBet)
router.get('/current-bets/:matchId', checkAuthentication, bettingController.currentBets)
router.get('/bet-history', checkAuthentication, bettingController.betHistory)
router.get('/user-bets', checkAuthentication, bettingController.userBets)


router.get('/getActiveBanners', checkAuthentication, adminController.getActiveBanners)
router.post('/getAllBanners', checkAuthentication, adminController.getAllBanners)
router.post('/getSingleBanner', checkAuthentication, adminController.getSingleBanner)

export default router

