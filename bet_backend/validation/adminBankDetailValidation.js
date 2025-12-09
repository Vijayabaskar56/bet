
import joi from 'joi'
class joiValidation{
    static addAdminSchema=joi.object({
        bank_name:joi.string().min(3).message({"string.min":"Bank Name Minimum 3 Characters"}).allow(!null),
        account_type:joi.string().allow(!null),
        account_name:joi.string().min(3).message({"string.min":"Account Name Minimum  3 Characters"}).allow(!null),
        account_no:joi.number().min(3).message({"number.min":"Kindly Enter a Valid Account Number","number":"ddd"}).allow(!null),
        ifsc_code:joi.string().pattern(new RegExp(/^[A-Za-z0-9]{3,15}$/)).message({"string.pattern.base":"Please Check the SWIFT Code "}).allow(!null),
        branch:joi.string().min(3).message({"string.min":"Branch Name Minimum  3 Characters"}).allow(!null),
        bank_address:joi.string().min(3).message({"string.min":"Bank Address Minimum  3 Characters"}).allow(!null),
        payment_id:joi.string().min(5).message({"string.min":"Payment Id Minimum 5 Characters"}).max(50).message({"string.max":"Payment Id, Maximum 50 Characters"}).allow(!null),
        payment_method:joi.number().required()
    })
    static addUserSchema=joi.object({
        bank_name:joi.string().min(3).message({"string.min":"Bank Name Minimum 3 Characters"}).allow(!null),
        account_type:joi.string().allow(!null),
        account_name:joi.string().min(3).message({"string.min":"Account Name Minimum  3 Characters"}).allow(!null),
        account_no:joi.string().min(3).message({"number.min":"Kindly Enter a Valid Account Number","number":"ddd"}).allow(!null),
        ifsc_code:joi.string().pattern(new RegExp(/^[A-Za-z0-9]{3,11}$/)).message({"string.pattern.base":"Please Check the SWIFT Code "}).allow(!null),
        branch:joi.string().min(3).message({"string.min":"Branch Name Minimum  3 Characters"}).allow(!null),
        bank_address:joi.string().regex(/^[A-Za-z0-9]/).message({"string.pattern.base":"Bank Address Pattern Wrong"}).allow(!null),
        payment_id:joi.string().min(5).message({"string.min":"UPI Id Minimum 5 Characters"}).max(50).message({"string.max":"UPI Id, Maximum 50 Characters"}).allow(!null),
        payment_method:joi.number().required(),
        primary_account:joi.boolean(),
        payment_type:joi.number()
    })
    static searchschema=joi.object({
        search:joi.string().required(),
    })

    static getUpdateByIdSchema=joi.object({
        bank_id:joi.string().required().required().allow(!null),
        bank_name:joi.string().min(3).message({"string.min":"Bank Name Minimum 3 Characters"}).allow(!null),
        account_type:joi.string().allow(!null),
        account_name:joi.string().min(3).message({"string.min":"Account Name Minimum  3 Characters"}).allow(!null),
        account_no:joi.number().min(3).message({"number.min":"Kindly Enter a Valid Account Number","number":"ddd"}).allow(!null),
        ifsc_code:joi.string().pattern(new RegExp(/^[A-Za-z0-9]{3,11}$/)).message({"string.pattern.base":"Please Check the SWIFT Code "}).allow(!null),        branch:joi.string().min(3).message({"string.min":"Branch Name Minimum  3 Characters"}).allow(!null),
        bank_address:joi.string().regex(/^[A-Za-z0-9]/).message({"string.pattern.base":"Bank Address Pattern Wrong"}).allow(!null),
        payment_id:joi.string().min(5).message({"string.min":"UPI Id Minimum 5 Characters"}).max(50).message({"string.max":"UPI Id, Maximum 50 Characters"}).allow(!null),
        primary_account:joi.boolean()
    })
    static getDeleteByIdSchema=joi.object({
        bank_id:joi.string().required()
    })
}
export {joiValidation}
