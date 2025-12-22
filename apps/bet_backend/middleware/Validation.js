import { modelValid } from '../validation/ModelValidation.js'
import { helper } from '../helper/helper.js'
// import { check, body, validationResult, param } from 'express-validator'



class modelValidation {
    static userValidation = async (req, res, next) => {
        let checkValidation = modelValid.userModelValidation.validate(req.body)
        if (checkValidation.error) {
            res.send(await helper.jsonresponse(null, checkValidation.error.details[0].message, null))
        }
        else {
            next()
        }

    }
    static userRegisterValidation = async (req, res, next) => {
        let checkValidation = modelValid.userRegisterModelValidation.validate(req.body)
        if (checkValidation.error) {
            res.send(await helper.jsonresponse(null, checkValidation.error.details[0].message, null))
        }
        else {
            next()
        }

    }
    static userLoginValid = async (req, res, next) => {
        let checkAuthentication = modelValid.userLogin.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication.error.message, null))
        } else {
            next()
        }
    }
    static emailPasswordValidation = async (req, res, next) => {
        let checkValidation = modelValid.authSchema.validate(req.body)
        if (checkValidation.error) {
            res.send(await helper.jsonresponse(null, checkValidation.error.details[0].message, null))
        }
        else {
            next()
        }

    }
    static loginValid = async (req, res, next) => {
        let checkAuthentication = modelValid.login.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication.error.details[0].message, null))
        }
        else {
            next()
        }
    }
    static suspendUser = async (req, res, next) => {
        let checkAuthentication = modelValid.suspend_user.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication?.error?.details?.[0]?.message, null))
        } else {
            next()
        }
    }
    static blockedUser = async (req, res, next) => {
        let checkAuthentication = modelValid.blocked_user.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication.error.details[0].message, null))
        } else {
            next()
        }
    }

    static placeBet = async (req, res, next) => {
        let checkAuthentication = modelValid.placeBet.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication?.error?.details?.[0]?.message, null))
        } else {
            next()
        }
    }

    static bannerCreate = async (req, res, next) => {
        let checkAuthentication = modelValid.bannerCreate.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication.error.details[0].message, null))
        }
        else {
            next()
        }
    }
    static bannerUpdate = async (req, res, next) => {
        let checkAuthentication = modelValid.bannerUpdate.validate(req.body)
        if (checkAuthentication.error) {
            res.send(await helper.jsonresponse(null, checkAuthentication.error.details[0].message, null))
        }
        else {
            next()
        }
    }
}
export { modelValidation }

