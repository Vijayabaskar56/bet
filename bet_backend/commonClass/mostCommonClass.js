// const jwt = require('jsonwebtoken')
import jwt from 'jsonwebtoken'
import encryptDecrypt from '../middleware/decryptEncrypt.js'
import { admin } from '../model/adminModel.js';
import { user } from '../model/userModel.js';


class checking {

    static adminExists = async (status, id, password, email) => {

        if (status == 'id') {
            const result = await admin.aggregate([{ $match: { $and: [{ _id: id }, { deleteFlag: false }] } }])
            return result[0]
        }

        if (status == 'password') {
            const result = await admin.findOne({ email: email })
            if (result == null || undefined) {
                return null
            }
            var decryptPassword = encryptDecrypt.decrypt(result.password)
            return decryptPassword === password
        }

        if (status == 'email') {
            const result = await admin.aggregate([{ $match: { $and: [{ email_id: email }, { role: 'admin' }] } }])
           return result
        }

    };

    static userExists = async (status, id, password, email) => {

        if (status == 'id') {
            const result = await user.aggregate([{ $match: { $and: [{ _id: id }, { deleteFlag: false }] } }])
            return result[0]
        }

        if (status == 'password') {
            const result = await user.aggregate([{ $match: { $and: [{ email: email }, { deleteFlag: false }] } }])
            var decryptPassword = encryptDecrypt.decrypt(result[0].password)
            return decryptPassword === password
        }

        if (status == 'email') {
            const result = await user.aggregate([{ $match: { $and: [{ email: email }, { deleteFlag: false }] } }])
            return result
        }

    };

    static validToken = async (status, token, id, cb,twofa, role) => {
        if (status === 'generate') {
            const result = jwt.sign({ id, role }, process.env.ENCRYPT_DECRYPT_SECRET_KEY)
            const user_data=await user.findOne({_id:id})
            if(user_data){
               if(user_data.authentic_status && user_data.authentic_status != "0"){
                    await user.findOneAndUpdate({_id : user_data._id},{$push:{temp_token : result}})
               }else{
                     await user.findOneAndUpdate({_id:user_data._id},{authToken:result})
               }
               return result
            }
            else{
                let checkStatus = await admin.findOne({_id:id, isDeleted : false})
                if(checkStatus.authentic_status==true){
                    await admin.findOneAndUpdate({_id:checkStatus.id},{$push:{temp_token:result}})
                 }else{
                     await admin.findOneAndUpdate({_id:checkStatus.id},{authToken:result})
                 }
                 return result
            }
        }
        if (status === 'check') {
            if(JSON.parse(token) == null){
                return null
            }
            const result =  jwt.decode(JSON.parse(token), process.env.ENCRYPT_DECRYPT_SECRET_KEY)
            const userTokenDetails = await user.findOne({_id:result.id},{authToken:1,temp_token:1})
            let adminTokenDetails;
            if(!userTokenDetails){
                adminTokenDetails = await admin.findOne({_id:result.id, isDeleted : false},{authToken:1,temp_token:1})
            }
            if(!adminTokenDetails && userTokenDetails){
                if(JSON.parse(token)==userTokenDetails.authToken ){
                    return result
                }else if(userTokenDetails.temp_token.includes(JSON.parse(token))) {
                   return result
                }else{
                    return null
                }
            }else if(!userTokenDetails && adminTokenDetails ){
                if(JSON.parse(token)==adminTokenDetails.authToken ){
                    return result
                }else if(adminTokenDetails.temp_token.includes(JSON.parse(token))) {
                    return result;
                }else{
                    null
                }
            }else{
                return null;
            }
        }

    }

}

export  { checking }
