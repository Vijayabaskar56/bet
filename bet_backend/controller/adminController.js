import { checking } from '../commonClass/mostCommonClass.js';
import { helper } from '../helper/helper.js';
import { Bet } from '../model/BetModel.js';
import encryption from '../middleware/decryptEncrypt.js';
import { admin, banners, siteSetting, supportchat } from '../model/adminModel.js';
import { transactionHistory, user } from '../model/userModel.js';



const adminLogin = async (req, res) => {
  try {
    admin.findOne({
      $and: [
        { $or: [{ email_id: req.body.email_id }, { name: req.body.email_id }] },
        { isDeleted: false }
      ]
    })
      .then(async (userData) => {
        if (userData) {
          var decryptPassword = await encryption.decrypt(userData.password)
          if (req.body.password == decryptPassword) {
            const token = await checking.validToken('generate', null, userData._id, null, null, userData.role)
            let dat = (userData.authToken != null && userData.authToken != token) ? false : userData.is_verify
            let data = userData._doc
            delete data.password; delete data.qrCode, delete data.authToken, delete data.email_otp
            const responseData = {
              token: token,
              userDeatils: userData,
              is_verify: userData.is_verify,
              login_first: userData.first_Login
            }
            await admin.findOneAndUpdate({ _id: userData._id }, { $set: { loginActivites: 1, is_verify: dat } })
            res.send(await helper.jsonresponse(true, 'login.loginsuccess', responseData))
            if (userData.first_Login == 1) {
              await user.findOneAndUpdate({ _id: userData._id }, { $set: { first_Login: 2 } })
            }
          }
          else {
            res.status(403).send(await helper.jsonresponse(false, 'login.wrongpassword', null))
          }

        }
        else {
          res.status(401).send(await helper.jsonresponse(false, 'accountverify.usernotexists', null))
        }
      })
  } catch (error) {
    res.status(500).send(await helper.jsonresponse(null, error.message, null))
  }
}

const getProfile = async (req, res) => {
  try {
    let userId = req.params.token.id;
    let userDetails = await admin.findOne({ _id: userId }).select(['role', 'balance']);
    if (!userDetails)
      userDetails = await user.findOne({ _id: userId }).select(['role', 'balance']);

    if (!userDetails) throw new Error('User not found');

    return res.send(await helper.jsonresponse(true, 'profile.profilefetchsuccess', userDetails));

  }
  catch (error) {
    return res.send(await helper.jsonresponse(false, error.message, null));
  }
}
const subadmincreate = async (req, res) => {
  try {
    let token = req.params.token.id
    if (!token) return res.status(440).send(await helper.jsonresponse(false, "token.tokennotfound", null))
    let { email_id, password, admin_name } = req.body
    req.body.password = await encryption.encrypt(req.body.password)
    let already = await admin.findOne({ email_id: email_id })
    if (already) return res.status(409).send(await helper.jsonresponse(false, "register.useralreadyexists", null))
    let same_data = await admin.findOne({ _id: token })
    if (same_data.role === 2) return res.status(403).send(await helper.jsonresponse(false, "Create Only Admin", null))
    let email = email_id
    if (email_id && password) {
      let data = {
        email_id: email_id,
        password: req.body.password,
        name: admin_name,
        role: 2,
        admin_id: token

      }
      console.log(data, "data");
      await admin.create(data).then(async (sub_admin) => {
        if (sub_admin) {
          var getParams = {
            'email': email,
            'username': admin_name,
            'password': password,
            'subject': 'Hi,  signing up with Admin ',
            'app_name': process.env.APP_NAME,
            'template': 'mail_verification',
            'support_mail': process.env.SUPPORTMAIL,
            'image_path': process.env.IMAGEURL,
            'mail_footer': process.env.MAIL_FOOTER
          }
          var sendmail = await helper.sendMail(getParams)
          console.log(sendmail, "sendmail");
          if (sendmail.status == true) return res.send(await helper.jsonresponse(true, 'register.registersuccess', sendmail))
        }
      }).catch((err) => {
        console.log(err);
      })

    } else {
      return res.status(400).send(await helper.jsonresponse(false, "register.missingparameters", null))

    }
  } catch (error) {
    res.status(500).send(await helper.jsonresponse(null, error.message, null))

  }


}
const create_admins_list = async (req, res) => {
  try {
    let token = req.params.token.id
    const pages = req.query.page;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(process.env.PAGE_SIZE, 10) || 5;
    const skip = (page - 1) * pageSize;
    if (!token) return res.status(200).send(await helper.jsonresponse(false, "token.tokennotfound", null))
    let matchrole = { role: req.body.role }
    let matchlookup = '';
    let localField = '';
    let foreignField;
    let { role,
      admin_id, admin_name,
      subadmin_id, subadmin_name,
      submaster_id, submaster_name,
      master, master_name,
      agent, agent_name,
      user_name
    } = req.body
    if (role == 1) {
      if (admin_id) {
        matchrole.admin_id = admin_id
      } else if (admin_name) {
        matchrole.adminname = admin_name
      }
      matchlookup = 'admins'
      localField = 'admin_id'
      foreignField = admin_id ? admin : admin
      admin_id ? matchrole.role += 1 : matchrole.role

    } else if (role == 2) {
      if (subadmin_id) {
        matchrole.createdBy = helper.getMongoType(subadmin_id)
      } else if (subadmin_name) {
        matchrole.name = subadmin_name
      }
      matchlookup = 'users'
      localField = 'createdBy'
      foreignField = subadmin_id ? user : admin
      subadmin_id ? matchrole.role += 1 : matchrole.role

    } else if (role == 3) {
      if (submaster_id) {
        matchrole.createdBy = helper.getMongoType(submaster_id)
      } else if (submaster_name) {
        matchrole.submastername = submaster_name
      }
      matchlookup = 'users'
      localField = 'createdBy'
      foreignField = submaster_id ? user : user


    } else if (role == 4) {
      if (master) {
        matchrole.createdBy = helper.getMongoType(master)
      } else if (master_name) {
        matchrole.mastername = master_name
      }
      matchlookup = 'users'
      localField = 'createdBy'
      foreignField = master ? user : user


    } else if (role == 5) {
      if (agent) {
        matchrole.createdBy = helper.getMongoType(agent)
      } else if (agent_name) {
        matchrole.matchname = agent_name
      }
      matchlookup = 'users'
      localField = 'createdBy'
      foreignField = agent ? user : user
    } else if (role == 6) {
      if (user_name) {
        matchrole.user_name = user_name
      } else {
        matchlookup = 'users'
        localField = 'createdBy'
        foreignField = user

      }
    }

    let aggregatePipeline = [
      { $match: matchrole },
      {
        $lookup: {
          from: matchlookup,
          localField: localField,
          foreignField: '_id',
          as: 'creatorDetails',
        },
      },
      {
        $unwind: {
          path: '$creatorDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          user_name: 1,
          name: 1 || null,
          email_id: 1,
          status: 1,
          creatorDetails: role == 6 ? '$creatorDetails' : null,
          createdBy: 1,
          createdAt: 1,
          email: 1,
          userCount: 1,
          balance: 1 || null,
          withdraw_amt: 1 || null,
          deposit_amt: 1 || null
        },
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          pagedData: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    ];

    let result = await foreignField.aggregate([aggregatePipeline]);


    if (result && result.length > 0) {
      const totalCount = result[0].totalCount[0]?.total || 0;
      const responseData = result[0].pagedData;
      return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }));
    } else {
      return res.status(401).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', []));
    }
  } catch (error) {
    return res.send(await helper.jsonresponse(false, error, []));

  }




  // if (req.body.role === 1) {
  //   if (req.body.admin_id) {
  //     let admin_data = await admin.find({ admin_id: req.body.admin_id }, ['email_id', 'name', 'role','balance'])
  //     if (admin_data) return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", admin_data))

  //   } else {
  //     const all_subadmins = await admin.find({ role: 1 }, ['email_id', 'name', 'role','balance'])
  //     if (req.body.admin_name && req.body.role === 1) {
  //       let data = all_subadmins.filter(el => el.name === req.body.admin_name)
  //       let totalCount = data.length;
  //       let responseData = await helper.paginate(data, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     }
  //     if (all_subadmins.length > 0) {
  //       let totalCount = all_subadmins.length;
  //       let responseData = await helper.paginate(all_subadmins, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     } else {
  //       res.status(200).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', []))

  //     }
  //   }
  // } else if (req.body.role === 2) {
  //   if (req.body.subadmin_id) {
  //     let admin_data = await user.find({ createdBy: req.body.subadmin_id }, ['email', 'user_name', 'role','balance'])
  //     if (admin_data) return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", admin_data))

  //   } else {
  //     const all_subadmins = await admin.find({ role: 2 }, ['email_id', 'name', 'role','balance'])
  //     if (req.body.subadmin_name && req.body.role === 2) {
  //       let data = all_subadmins.filter(el => el.name === req.body.subadmin_name)
  //       let totalCount = data.length;
  //       let responseData = await helper.paginate(data, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     }
  //     if (all_subadmins.length > 0) {
  //       let totalCount = all_subadmins.length;
  //       let responseData = await helper.paginate(all_subadmins, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     } else {
  //       res.status(200).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', []))

  //     }
  //   }
  // } else if (req.body.role === 3) {
  //   if (req.body.master) {
  //     let admin_data = await user.find({ createdBy: req.body.master }, ['email', 'user_name', 'role','balance'])
  //     if (admin_data) return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", admin_data))

  //   } else {
  //     const all_subadmins = await user.find({ role: 3 }, ['email', 'user_name', 'role','balance'])
  //     if (req.body.master_name && req.body.role === 3) {
  //       let data = all_subadmins.filter(el => el.user_name === req.body.master_name)
  //       let totalCount = data.length;
  //       let responseData = await helper.paginate(data, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     }
  //     if (all_subadmins.length > 0) {
  //       let totalCount = all_subadmins.length;
  //       let responseData = await helper.paginate(all_subadmins, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     } else {
  //       res.status(200).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', []))

  //     }
  //   }

  // } else if (req.body.role === 4) {
  //   if (req.body.agent) {
  //     let admin_data = await user.find({ $and: [{ role: 5 }, { createdBy: req.body.agent }] }, ['email', 'user_name', 'role','balance'])
  //     if (admin_data) return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", admin_data))

  //   } else {
  //     const all_subadmins = await user.find({ role: 4 }, ['email', 'user_name', 'role','balance'])
  //     if (req.body.agent_name && req.body.role === 4) {
  //       let data = all_subadmins.filter(el => el.user_name === req.body.agent_name)
  //       let totalCount = data.length;
  //       let responseData = await helper.paginate(data, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     }
  //     if (all_subadmins.length > 0) {
  //       let totalCount = all_subadmins.length;
  //       let responseData = await helper.paginate(all_subadmins, pages);
  //       return res.status(200).send(await helper.jsonresponse(true, "commonmessage.detailsfetchsuccess", { data: responseData, totalCount }))
  //     } else {
  //       res.status(200).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', []))

  //     }
  //   }
  // } else if (req.body.role === 5) {
  //   const userData = await user.aggregate([
  //     { $match: { role: 5 } },
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'createdBy',
  //         foreignField: '_id',
  //         as: 'creatorDetails',
  //       },
  //     },
  //     {
  //       $unwind: {
  //         path: '$creatorDetails',
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },
  //     {
  //       $project: {
  //         user_name: 1,
  //         status: 1,
  //         creatorDetails: "$creatorDetails",
  //         createdBy: 1,
  //         createdAt: 1,
  //         email: 1,
  //         userCount: 1,
  //         balance : 1
  //       },
  //     },
  //     {
  //       $facet: {
  //         totalCount: [{ $count: 'total' }],
  //         pagedData: [
  //           { $sort: { createdAt: -1 } },
  //           { $skip: skip },
  //           { $limit: pageSize },
  //         ],
  //       },
  //     },
  //   ]);

  //   const [result] = userData
  //   return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { ...result, totalCount: result.totalCount[0]?.total }))
  // }
}
const logOut = async (req, res) => {
  const token = req.params.token
  admin.findOne({ _id: token.id }).then(async (userData) => {
    if (userData) {
      let updateData = { is_verify: false, authToken: null, loginActivites: 0, socket_id: "" };
      await admin.findOneAndUpdate({ email_id: userData.email_id }, updateData);

      res.status(200).send(await helper.jsonresponse(true, 'logOut.message', null))
    } else {
      res.status(200).send(await helper.jsonresponse(false, 'login.accountnotfound', null))
    }

  })

}
// const admin_Transaction = async (req, res) => {
//   let token = req.params.token
//   const { type, password, multi_trans_data, } = req.body;
//   //transaction  type 1 deposit type 2 withdraw

//   await Promise.all(multi_trans_data.map(async (el) => {
//     if (el.type == 1) {
//       let sender
//       sender = await admin.findOne({ _id: token.id });
//       if (!sender) {
//         sender = await user.findOne({ _id: token.id });
//         if (!sender) { return res.status(200).send(await helper.jsonresponse(false, "Sender not found")); }
//       }
//       let receiver;
//       receiver = await admin.findOne({ _id: el?.receiverId });
//       if (!receiver) {
//         receiver = await user.findOne({ _id: el?.receiverId })
//         if (!receiver) { return res.status(200).send(await helper.jsonresponse(false, "Receiver not found", null)); }
//       }
//       let check = sender._id == receiver.admin_id || receiver.createdBy
//       if (check == false) { return res.status(200).send(await helper.jsonresponse(false, "This Not Your's Parent")) }

//       try {
//         if (sender.balance < el.amount) {
//           return res.status(200).send(await helper.jsonresponse(false, "Insufficient balance"));
//         }
//         if (sender) {
//           let decryptPassword = await encryption.decrypt(sender.password)
//           if (password != decryptPassword) { return res.status(200).send(await helper.jsonresponse(false, 'login.wrongpassword', null)) }
//         }

//         let updatedSender
//         updatedSender = await admin.findOneAndUpdate(
//           { _id: sender._id },
//           { $inc: { balance: -el.amount, deposit_amt: el.amount } },
//           { new: true }
//         );
//         if (!updatedSender) {
//           updatedSender = await user.findOneAndUpdate(
//             { _id: sender._id },
//             { $inc: { balance: -el.amount, deposit_amt: el.amount } },
//             { new: true }
//           );
//         }

//         let updatedReceiver;
//         updatedReceiver = await admin.findOneAndUpdate(
//           { _id: receiver._id },
//           { $inc: { balance: el.amount } },
//           { new: true }
//         );
//         if (!updatedReceiver) {
//           updatedReceiver = await user.findOneAndUpdate(
//             { _id: receiver._id },
//             { $inc: { balance: el.amount } },
//             { new: true }
//           );
//         }
//         let deposite_from_upline = 0, deposite_to_downline = 0;
//         if (token.role < receiver.role) { // downline deposite
//           deposite_to_downline = el.amount
//         } else {
//           deposite_from_upline = el.amount
//         }
//         console.log(deposite_to_downline, deposite_from_upline)
//         if (updatedSender && updatedReceiver) {
//           const transactionSender = {
//             sender_id: sender._id,
//             sender_name: sender.name || sender.user_name,
//             receiver_id: receiver._id,
//             receiver_name: receiver.name || receiver.user_name,
//             deposite_from_upline,
//             deposite_to_downline,
//             type: type,
//             remaining_balance: updatedSender.balance,
//             remarks: el.remark,
//           };

//           let trans_data = await transactionHistory.create(transactionSender);
//           if (trans_data) {
//             res.status(200).send(await helper.jsonresponse(true, "Transaction completed successfully", null));
//           }

//         } else {
//           return res.status(200).send(await helper.jsonresponse(false, "Failed to update balances"));
//         }

//       } catch (error) {
//         return res.status(200).send(await helper.jsonresponse(false, "An error occurred while processing the transaction"));
//       }
//     } else {
//       try {
//         let withdraw_senders
//         withdraw_senders = await admin.findOne({ _id: token.id })
//         if (!withdraw_senders) {
//           withdraw_senders = await user.findOne({ _id: token.id })
//           if (!withdraw_senders) { return res.status(200).send(await helper.jsonresponse(false, 'Receiver not found', null)) }
//         }
//         let withdraw_receiver
//         withdraw_receiver = await admin.findOne({ _id: el?.receiverId })
//         if (!withdraw_receiver) {
//           withdraw_receiver = await user.findOne({ _id: el?.receiverId })
//         }
//         if (withdraw_receiver.balance < el.amount) {
//           return res.status(200).send(await helper.jsonresponse(false, "Insufficient balance"))
//         }
//         if (withdraw_senders) {
//           let decryptPassword = await encryption.decrypt(withdraw_senders.password)
//           if (password != decryptPassword) { return res.status(200).send(await helper.jsonresponse(false, 'login.wrongpassword', null)) }
//         }

//         // let check = withdraw_senders._id == withdraw_receiver.admin_id || withdraw_receiver.createdBy
//         // if(check == false) {return res.status(200).send(await helper.jsonresponse(false ,"This Not Your's Parent")) }
//         let withdraw_update_sender
//         withdraw_update_sender = await admin.findOneAndUpdate(
//           { _id: withdraw_senders._id },
//           { $inc: { balance: el.amount, withdraw_amt: el.amount } },
//           { new: true }
//         )
//         if (!withdraw_update_sender) {
//           withdraw_update_sender = await user.findOneAndUpdate(
//             { _id: withdraw_senders._id },
//             { $inc: { balance: el.amount, withdraw_amt: el.amount } },
//             { new: true }
//           )
//         }
//         let withdraw_update_receiver
//         withdraw_update_receiver = await admin.findOneAndUpdate(
//           { _id: withdraw_receiver._id },
//           { $inc: { balance: -el.amount } },
//           { new: true }
//         )
//         if (!withdraw_update_receiver) {
//           withdraw_update_receiver = await user.findOneAndUpdate(
//             { _id: withdraw_receiver._id },
//             { $inc: { balance: -el.amount } },
//             { new: true }
//           )

//         }
//         let withdraw_by_upline = 0, withdraw_from_downline = 0;
//         if (token.role < withdraw_receiver.role) { // withdraw from deposite
//           withdraw_from_downline = el.amount
//         } else {
//           withdraw_by_upline = el.amount
//         }
//         console.log(withdraw_by_upline, withdraw_from_downline)
//         if (withdraw_update_sender && withdraw_update_receiver) {
//           const transactionSender = {
//             sender_id: withdraw_senders._id,
//             sender_name: withdraw_senders.name || withdraw_senders.user_name,
//             receiver_id: withdraw_receiver._id,
//             receiver_name: withdraw_receiver.name || withdraw_receiver.user_name,
//             withdraw_from_downline,
//             withdraw_by_upline,
//             type: type,
//             remaining_balance: withdraw_update_sender.balance,
//             remarks: el.remark,
//           };

//           let trans_data = await transactionHistory.create(transactionSender);
//           if (trans_data) {
//             res.status(200).send(await helper.jsonresponse(true, "Transaction completed successfully", { data: withdraw_update_receiver }));
//           }
//         } else {
//           return res.status(200).send(await helper.jsonresponse(false, "Failed to update balances"));
//         }

//       } catch (error) {
//         return res.status(200).send(await helper.jsonresponse(false, "An error occurred while processing the transaction"));
//       }
//     }
//   }))
// }
// const admin_Transaction = async (req, res) => {
//   let token = req.params.token
//   const { password, multi_trans_data, } = req.body;
//   //transaction  type 1 deposit type 2 withdraw
//   await Promise.all(multi_trans_data.map(async (el) => {
//     if (el.type == 1) {
//       let sender
//       sender = await admin.findOne({ _id: token.id });
//       if (!sender) {
//         sender = await user.findOne({ _id: token.id });
//         if (!sender) { return res.status(401).send(await helper.jsonresponse(false, "Sender not found")); }
//       }
//       let receiver;
//       receiver = await admin.findOne({ _id: el?.receiverId });
//       if (!receiver) {
//         receiver = await user.findOne({ _id: el?.receiverId })
//         if (!receiver) { return res.status(401).send(await helper.jsonresponse(false, "Receiver not found", null)); }
//       }
//       let check = sender._id == receiver.admin_id || receiver.createdBy
//       if (check == false) { return res.status(403).send(await helper.jsonresponse(false, "This Not Your's Parent")) }

//       try {
//         if (sender.balance < el.deposit_amount) {
//           return res.status(409).send(await helper.jsonresponse(false, "Insufficient balance"));
//         }
//         if (sender) {
//           let decryptPassword = await encryption.decrypt(sender.password)
//           if (password != decryptPassword) { return res.status(401).send(await helper.jsonresponse(false, 'login.wrongpassword', null)) }
//         }

//         let updatedSender
//         updatedSender = await admin.findOneAndUpdate(
//           { _id: sender._id },
//           { $inc: { balance: -el.deposit_amount, deposit_amt: el.deposit_amount } },
//           { new: true }
//         );
//         if (!updatedSender) {
//           updatedSender = await user.findOneAndUpdate(
//             { _id: sender._id },
//             { $inc: { balance: -el.deposit_amount, deposit_amt: el.deposit_amount } },
//             { new: true }
//           );
//         }

//         let updatedReceiver;
//         updatedReceiver = await admin.findOneAndUpdate(
//           { _id: receiver._id },
//           { $inc: { balance: el.deposit_amount } },
//           { new: true }
//         );
//         if (!updatedReceiver) {
//           updatedReceiver = await user.findOneAndUpdate(
//             { _id: receiver._id },
//             { $inc: { balance: el.deposit_amount } },
//             { new: true }
//           );
//         }
//         let deposite_from_upline = 0, deposite_to_downline = 0;
//         if (token.role < receiver.role) { // downline deposite
//           deposite_to_downline = el.deposit_amount
//         } else {
//           deposite_from_upline = el.deposit_amount
//         }
//         console.log(deposite_to_downline, deposite_from_upline)
//         if (updatedSender && updatedReceiver) {
//           const transactionSender = {
//             sender_id: sender._id,
//             sender_name: sender.name || sender.user_name,
//             sender_role: token.role,
//             receiver_id: receiver._id,
//             receiver_name: receiver.name || receiver.user_name,
//             receiver_role: receiver.role,
//             amount: el.deposit_amount,
//             type: el.type,
//             remaining_balance: updatedReceiver.balance,
//             remarks: el.remark,
//           };

//           let trans_data = await transactionHistory.create(transactionSender);
//           if (trans_data) {
//             return res.status(200).send(await helper.jsonresponse(true, "Transaction completed successfully", null));
//           }

//         } else {
//           return res.status(200).send(await helper.jsonresponse(false, "Failed to update balances"));
//         }

//       } catch (error) {
//         return res.status(500).send(await helper.jsonresponse(false, "An error occurred while processing the transaction"));
//       }
//     } else {
//       try {
//         let withdraw_senders
//         withdraw_senders = await admin.findOne({ _id: token.id })
//         if (!withdraw_senders) {
//           withdraw_senders = await user.findOne({ _id: token.id })
//           if (!withdraw_senders) { return res.status(401).send(await helper.jsonresponse(false, 'Receiver not found', null)) }
//         }
//         let withdraw_receiver
//         withdraw_receiver = await admin.findOne({ _id: el?.receiverId })
//         if (!withdraw_receiver) {
//           withdraw_receiver = await user.findOne({ _id: el?.receiverId })
//         }
//         if (withdraw_receiver.balance < el.amount) {
//           return res.status(401).send(await helper.jsonresponse(false, "Insufficient balance"))
//         }
//         if (withdraw_senders) {
//           let decryptPassword = await encryption.decrypt(withdraw_senders.password)
//           if (password != decryptPassword) { return res.status(401).send(await helper.jsonresponse(false, 'login.wrongpassword', null)) }
//         }

//         // let check = withdraw_senders._id == withdraw_receiver.admin_id || withdraw_receiver.createdBy
//         // if(check == false) {return res.status(200).send(await helper.jsonresponse(false ,"This Not Your's Parent")) }
//         let withdraw_update_sender
//         withdraw_update_sender = await admin.findOneAndUpdate(
//           { _id: withdraw_senders._id },
//           { $inc: { balance: el.amount, withdraw_amt: el.amount } },
//           { new: true }
//         )
//         if (!withdraw_update_sender) {
//           withdraw_update_sender = await user.findOneAndUpdate(
//             { _id: withdraw_senders._id },
//             { $inc: { balance: el.amount, withdraw_amt: el.amount } },
//             { new: true }
//           )
//         }
//         let withdraw_update_receiver
//         withdraw_update_receiver = await admin.findOneAndUpdate(
//           { _id: withdraw_receiver._id },
//           { $inc: { balance: -el.amount } },
//           { new: true }
//         )
//         if (!withdraw_update_receiver) {
//           withdraw_update_receiver = await user.findOneAndUpdate(
//             { _id: withdraw_receiver._id },
//             { $inc: { balance: -el.amount } },
//             { new: true }
//           )

//         }
//         let withdraw_by_upline = 0, withdraw_from_downline = 0;
//         if (token.role < withdraw_receiver.role) { // withdraw from deposite
//           withdraw_from_downline = el.amount
//         } else {
//           withdraw_by_upline = el.amount
//         }
//         console.log(withdraw_by_upline, withdraw_from_downline)
//         if (withdraw_update_sender && withdraw_update_receiver) {
//           const transactionSender = {
//             sender_id: withdraw_senders._id,
//             sender_name: withdraw_senders.name || withdraw_senders.user_name,
//             sender_role: token.role,
//             receiver_role: withdraw_receiver.role,
//             receiver_id: withdraw_receiver._id,
//             receiver_name: withdraw_receiver.name || withdraw_receiver.user_name,
//             amount: el.amount,
//             type: el.type,
//             remaining_balance: withdraw_update_sender.balance,
//             remarks: el.remark,
//           };

//           let trans_data = await transactionHistory.create(transactionSender);
//           if (trans_data) {
//             res.status(200).send(await helper.jsonresponse(true, "Transaction completed successfully", { data: withdraw_update_receiver }));
//           }
//         } else {
//           return res.status(200).send(await helper.jsonresponse(false, "Failed to update balances"));
//         }

//       } catch (error) {
//         return res.status(500).send(await helper.jsonresponse(false, "An error occurred while processing the transaction"));
//       }
//     }
//   }))
// }
const admin_Transaction = async (req, res) => {
  let token = req.params.token;
  const { password, multi_trans_data } = req.body;
  let responseSent = false;  // Flag to track if response is already sent
  await Promise.all(multi_trans_data.map(async (el) => {
    if (responseSent) return;  // Prevent further processing if response is already sent

    if (el.type == 1) {  // Deposit
      let sender;
      let isAdmin = false;
      sender = await admin.findOne({ _id: token.id });
      if (sender) {
        if (sender.role == 1)
          isAdmin = true;
      }
      else {
        sender = await user.findOne({ _id: token.id });
        if (!sender) {
          if (!responseSent) {
            responseSent = true;
            return res.send(await helper.jsonresponse(false, "Sender not found"));
          }
        }
      }
      let receiver;
      receiver = await admin.findOne({ _id: el?.receiverId });
      if (!receiver) {
        receiver = await user.findOne({ _id: el?.receiverId });
        if (!receiver) {
          if (!responseSent) {
            responseSent = true;
            return res.send(await helper.jsonresponse(false, "Receiver not found", null));
          }
        }
      }

      let check = sender._id == receiver.admin_id || receiver.createdBy;
      if (check == false) {
        if (!responseSent) {
          responseSent = true;
          return res.send(await helper.jsonresponse(false, "This Not Your's Parent"));
        }
      }

      try {
        if (!isAdmin && sender.balance < el.deposit_amount) {
          if (!responseSent) {
            responseSent = true;
            return res.send(await helper.jsonresponse(false, "Insufficient balance"));
          }
        }

        if (sender) {
          let decryptPassword = await encryption.decrypt(sender.password);
          if (password != decryptPassword) {
            if (!responseSent) {
              responseSent = true;
              return res.send(await helper.jsonresponse(false, 'login.wrongpassword', null));
            }
          }
        }

        let updatedSender;
        updatedSender = await admin.findOneAndUpdate(
          { _id: sender._id },
          { $inc: { balance: -el.deposit_amount, deposit_amt: el.deposit_amount } },
          { new: true }
        );
        if (!updatedSender) {
          updatedSender = await user.findOneAndUpdate(
            { _id: sender._id },
            { $inc: { balance: -el.deposit_amount, deposit_amt: el.deposit_amount } },
            { new: true }
          );
        }

        let updatedReceiver;
        updatedReceiver = await admin.findOneAndUpdate(
          { _id: receiver._id },
          { $inc: { balance: el.deposit_amount } },
          { new: true }
        );
        if (!updatedReceiver) {
          updatedReceiver = await user.findOneAndUpdate(
            { _id: receiver._id },
            { $inc: { balance: el.deposit_amount } },
            { new: true }
          );
        }

        let deposite_from_upline = 0, deposite_to_downline = 0;
        if (token.role < receiver.role) { // downline deposit
          deposite_to_downline = el.deposit_amount;
        } else {
          deposite_from_upline = el.deposit_amount;
        }

        if (updatedSender && updatedReceiver) {
          const transactionSender = {
            sender_id: sender._id,
            sender_name: sender.name || sender.user_name,
            sender_role: token.role,
            receiver_id: receiver._id,
            receiver_name: receiver.name || receiver.user_name,
            receiver_role: receiver.role,
            amount: el.deposit_amount,
            type: el.type,
            remaining_balance: updatedReceiver.balance,
            remarks: el.remark,
          };

          let trans_data = await transactionHistory.create(transactionSender);
          if (trans_data) {
            if (!responseSent) {
              responseSent = true;
              return res.send(await helper.jsonresponse(true, "Transaction completed successfully", null));
            }
          }

        } else {
          if (!responseSent) {
            responseSent = true;
            return res.send(await helper.jsonresponse(false, "Failed to update balances"));
          }
        }

      } catch (error) {
        if (!responseSent) {
          responseSent = true;
          return res.send(await helper.jsonresponse(false, "An error occurred while processing the transaction"));
        }
      }

    } else {  // Withdraw
      try {
        let withdraw_senders;
        withdraw_senders = await admin.findOne({ _id: token.id });
        if (!withdraw_senders) {
          withdraw_senders = await user.findOne({ _id: token.id });
          if (!withdraw_senders) {
            if (!responseSent) {
              responseSent = true;
              return res.send(await helper.jsonresponse(false, 'Sender not found', null));
            }
          }
        }

        let withdraw_receiver;
        withdraw_receiver = await admin.findOne({ _id: el?.withdraw_sender });
        if (!withdraw_receiver) {
          withdraw_receiver = await user.findOne({ _id: el?.withdraw_sender });
        }

        if (withdraw_receiver.balance < el.amount) {
          if (!responseSent) {
            responseSent = true;
            return res.send(await helper.jsonresponse(false, "Insufficient balance"));
          }
        }

        if (withdraw_senders) {
          let decryptPassword = await encryption.decrypt(withdraw_senders.password);
          if (password != decryptPassword) {
            if (!responseSent) {
              responseSent = true;
              return res.send(await helper.jsonresponse(false, 'login.wrongpassword', null));
            }
          }
        }

        let withdraw_update_sender;
        withdraw_update_sender = await admin.findOneAndUpdate(
          { _id: withdraw_senders._id },
          { $inc: { balance: el.withdraw_amount, withdraw_amt: el.withdraw_amount } },
          { new: true }
        );
        if (!withdraw_update_sender) {
          withdraw_update_sender = await user.findOneAndUpdate(
            { _id: withdraw_senders._id },
            { $inc: { balance: el.withdraw_amount, withdraw_amt: el.withdraw_amount } },
            { new: true }
          );
        }

        let withdraw_update_receiver;
        withdraw_update_receiver = await admin.findOneAndUpdate(
          { _id: withdraw_receiver._id },
          { $inc: { balance: -el.withdraw_amount } },
          { new: true }
        );
        if (!withdraw_update_receiver) {
          withdraw_update_receiver = await user.findOneAndUpdate(
            { _id: withdraw_receiver._id },
            { $inc: { balance: -el.withdraw_amount } },
            { new: true }
          );
        }

        let withdraw_by_upline = 0, withdraw_from_downline = 0;
        if (token.role < withdraw_receiver.role) { // withdraw from downline
          withdraw_from_downline = el.withdraw_amount;
        } else {
          withdraw_by_upline = el.withdraw_amount;
        }

        if (withdraw_update_sender && withdraw_update_receiver) {
          const transactionSender = {
            sender_id: withdraw_senders._id,
            sender_name: withdraw_senders.name || withdraw_senders.user_name,
            sender_role: token.role,
            receiver_role: withdraw_receiver.role,
            receiver_id: withdraw_receiver._id,
            receiver_name: withdraw_receiver.name || withdraw_receiver.user_name,
            amount: el.amount,
            type: el.type,
            remaining_balance: withdraw_update_sender.balance,
            remarks: el.remark,
          };

          let trans_data = await transactionHistory.create(transactionSender);
          if (trans_data) {
            if (!responseSent) {
              responseSent = true;
              return res.send(await helper.jsonresponse(true, "Transaction completed successfully", { data: withdraw_update_receiver }));
            }
          }
        } else {
          if (!responseSent) {
            responseSent = true;
            return res.send(await helper.jsonresponse(false, "Failed to update balances"));
          }
        }

      } catch (error) {
        if (!responseSent) {
          responseSent = true;
          return res.send(await helper.jsonresponse(false, "An error occurred while processing the transaction"));
        }
      }
    }
  }));
};
// const transaction_his = async (req, res) => {
//   const token = req.params.token.id
//   const page = parseInt(req.query.page, 10) || 1;
//   const pageSize = parseInt(process.env.PAGE_SIZE, 10) || 5;
//   const skip = (page - 1) * pageSize;
//   const matchConditions = {
//     $or: [],
//   };

//   if (req.body.user_id) {
//     matchConditions.$or.push({
//       sender_id: req.body.user_id
//     });
//     matchConditions.$or.push({
//       receiver_id: req.body.user_id
//     });
//   } else {
//     matchConditions.$or.push({
//       sender_id: token
//     });
//     matchConditions.$or.push({
//       receiver_id: token
//     });
//   }

//   if (matchConditions.$or.length === 0) {
//     delete matchConditions.$or;
//   }
//   const history = await transactionHistory.aggregate([
//     {
//       $match: matchConditions
//     },
//     {
//       $project: {
//         sender_id: 1,
//         sender_name: 1,
//         receiver_name: 1,
//         receiver_id: 1,
//         remarks: 1,
//         remaining_balance: 1,
//         lineType: { $cond: { if: { $eq: ["$receiver_id", token] }, then: 1, else: 2 } },
//         type: 1,
//         createdAt: 1,
//       }
//     },
//     {
//       $facet: {
//         totalCount: [{ $count: 'total' }],
//         pagedData: [
//           { $sort: { createdAt: -1 } },
//           { $skip: skip },
//           { $limit: pageSize },
//         ],
//       },
//     },
//   ])
//   // deposite_to_downline: 1,
//   // deposite_by_upline: 1,
//   // withdraw_from_downline: 1,
//   // withdraw_by_upline: 1,
//   const [result] = history
//   return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { ...result, totalCount: result.totalCount[0]?.total }))
// }
const transaction_his = async (req, res) => { // Don't Touch this
  try {
    const token = req.params.token
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.body.page, 10) || 5;
    const skip = (page - 1) * pageSize;
    const matchConditions = {
      $or: [],
    };
    const userData = await user.findById(req.body.user_id)
    if (req.body.user_id) {
      matchConditions.$or.push({
        sender_id: req.body.user_id
      });
      matchConditions.$or.push({
        receiver_id: req.body.user_id
      });
    } else {
      matchConditions.$or.push({
        sender_id: token.id
      });
      matchConditions.$or.push({
        receiver_id: token.id
      });
    }

    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }
    const history = await transactionHistory.aggregate([
      {
        $match: matchConditions
      },
      {
        // Step 1: Add dynamic fields for each transaction type
        $addFields: {
          deposite_to_downline: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$type", 1] },
                  { $gt: ["$sender_role", userData ? userData.role : token.role] }
                ]
              },
              then: "$amount",
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$type", 1] },
                      { $gt: ["$receiver_role", userData ? userData.role : token.role] }
                    ]
                  },
                  then: "$amount",
                  else: 0
                }
              }
            }
          },
          deposite_by_upline: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$type", 1] },
                  { $lt: ["$sender_role", userData ? userData.role : token.role] }
                ]
              },
              then: "$amount",
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$type", 1] },
                      { $lt: ["$receiver_role", userData ? userData.role : token.role] }
                    ]
                  },
                  then: "$amount",
                  else: 0
                }
              }
            }
          },
          withdraw_from_downline: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$type", 2] },
                  { $gt: ["$sender_role", userData ? userData.role : token.role] }
                ]
              },
              then: "$amount",
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$type", 2] },
                      { $gt: ["$receiver_role", userData ? userData.role : token.role] }
                    ]
                  },
                  then: "$amount",
                  else: 0
                }
              }
            }
          },
          withdraw_by_upline: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$type", 2] },
                  { $lt: ["$sender_role", userData ? userData.role : token.role] }
                ]
              },
              then: "$amount",
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$type", 2] },
                      { $lt: ["$receiver_role", userData ? userData.role : token.role] }
                    ]
                  },
                  then: "$amount",
                  else: 0
                }
              }
            }
          }
        }
      },
      {
        $project: {
          sender_id: 1,
          sender_name: 1,
          sender_role: 1,
          receiver_role: 1,
          amount: 1,
          receiver_id: 1,
          receiver_name: 1,
          type: 1,
          remaining_balance: 1,
          from_to: 1,
          remarks: 1,
          transaction_type: 1,
          createdAt: 1,
          updatedAt: 1,
          deposite_to_downline: 1,
          deposite_by_upline: 1,
          withdraw_from_downline: 1,
          withdraw_by_upline: 1
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          pagedData: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    ])

    const [result] = history
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { ...result, totalCount: result.totalCount[0]?.total }))
  } catch (error) {
    res.status(500).send(await helper.jsonresponse(false, 'commonmessage.failure', error.message));
  }
}

const getUnreadMessage = async (req, res) => {
  try {
    const token = req.params.token
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 5;
    const skip = (page - 1) * pageSize;
    helper.getMongoType(token.id);
    const matchConditions = {
      $or: [],
      $and: [],
    };
    if (token?.role === 1) {
      matchConditions.$or.push({
        role: 2,
        admin_id: token.id
      })
    }

    if (token?.role === 2) {
      matchConditions.$or.push({
        createdBy: helper.getMongoType(token.id)
      });
    }

    if (req?.query?.user_name && req?.query?.user_name !== 'null') {
      matchConditions.$and.push({
        user_name: { $regex: req?.query?.user_name, $options: 'i' },
      });
    }
    if (req?.query?.status && req?.query?.status !== 'null') {
      matchConditions.$and.push({
        readedAt: { $ne: null }
      });
    }

    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }

    if (matchConditions.$and.length === 0) {
      delete matchConditions.$and;
    }
    const testModel = token.role === 2 ? user : admin

    const usersWithUnreadMessages = await testModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "supportchats",
          let: { parent: { "$toString": "$_id" } },
          pipeline: [
            { $addFields: { child: "$sender_id" } },
            { $match: { $expr: { $eq: ["$child", "$$parent"] } } },
            { $project: { _id: 0, totalChats: { $size: "$chats" } } }
          ],
          as: 'supportChats'
        }
      },
      {
        $unwind: { path: "$supportChats", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          user_name: 1,
          email: 1,
          email_id: 1,
          name: 1,
          unreadMessagesCount: 1,
          createdAt: 1,
          role: 1,
          unreadMessage: { $ifNull: ["$supportChats.totalChats", 0] }
        }
      },
      {
        $sort: {
          unreadMessage: -1 // Sort by unread message count in descending order
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          pagedData: [
            { $skip: skip }, // Use skip for pagination
            { $limit: pageSize } // Limit results per page
          ]
        }
      }
    ]);
    const [result] = usersWithUnreadMessages

    res.status(200).send(await helper.jsonresponse(true, 'commonmessage.success', { ...result, totalCount: result.totalCount?.[0]?.total }));
  } catch (error) {
    console.error(error);
    res.status(500).send(await helper.jsonresponse(false, 'commonmessage.failure', error.message));
  }
}
const updateUnreadMessage = async (req, res) => {
  try {
    const token = req.params.token
    const { chatId } = req.body;
    const chatThread = await supportchat.findOne({ 'chats.receiver_id': token.id, 'chats.sender_id': chatId, readedAt: null });
    if (!chatThread) {
      return res.status(401).send(await helper.jsonresponse(false, 'Chat thread not found', null));
    }

    chatThread.chats.forEach(chat => {
      console.log(chat, "hjdgdfgdgjdghhdfghghdfgdfh")
      if (chat.receiver_id.includes(token.id)) {
        chat.readedAt = new Date();
      }
    });

    await chatThread.save();

    res.status(200).send(await helper.jsonresponse(true, 'Messages marked as read', chatThread));
  } catch (error) {
    console.error(error);
    res.status(500).send(await helper.jsonresponse(false, 'Error marking messages as read', error.message));
  }
}


const admin_balns_create = async (req, res) => {
  let token = req.params.token.id
  let { admin_amt } = req.body
  let data = await admin.findOne({ _id: token })
  if (data.role == 1) {
    let update_amt = await admin.findOneAndUpdate({ _id: token }, { $inc: { balance: admin_amt } })
    if (update_amt) {
      res.status(200).send(await helper.jsonresponse(true, "commonmessage.createsuccess", { data: update_amt }))
    }
  } else {
    return res.status(200).send(await helper.jsonresponse(false, "Admin Only Add Balance", null))
  }
}

const userBetHistory = async (req, res) => {
  try {
    let { page, limit } = req.query;
    let { startDate, endDate, status, user_name, marketType, type } = req.body;
    page = Number(page || 1);
    limit = Number(limit || 10);

    const matchConditions = {
      status: status ? status : { $exists: true },
      marketType: marketType ? Number(marketType) : { $exists: true },
      type: type ? type : { $exists: true }
    };
    const childMatchConditions = {
      user_name: user_name ? { $regex: user_name, $options: 'i' } : { $exists: true },
    }
    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate) matchConditions.createdAt.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 1));
      if (endDate) matchConditions.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    const result = await Bet.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "users",
          let: { currentUserId: "$userId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$currentUserId"] } } },
            { $project: { _id: 0, user_name: 1, email: 1 } },
          ],
          as: "User",
        }
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "matches",
          let: { betMatchId: { $toInt: "$matchId" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$matchId", "$$betMatchId"]
                }
              }
            }
          ],
          as: "match"
        }
      },
      { $unwind: { path: "$match", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "trades",
          let: { currentUserId: "$userId", parentMarkId: "$marketId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$marketId", "$$parentMarkId"] },
                  { $or: [{ $eq: ["$backUserId", "$$currentUserId"] }, { $eq: ["$layUserId", "$$currentUserId"] }] },
                    // { $eq: ["$status", "settled"] },
                  ]
                },
              }
            },
          ],
          as: "trade"
        }
      },
      { $unwind: { path: "$trade", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          matchName: "$match.matchName",
          eventName: 1,
          selectionName: 1,
          user_name: "$User.user_name",
          winner: "$trade.winner",
          selectionId: 1,
          matchId: 1,
          price: "$odds",
          type: 1,
          pnl: 1,
          size: {
            $cond: {
              if: { $eq: ["$marketType", 1] },
              then: "$initialStake",
              else: "$stake",
            },
          },
          status: 1,
          oddType: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$marketType", 1] },
                  then: "Match",
                },
                {
                  case: { $eq: ["$marketType", 2] },
                  then: "Bookmaker",
                },
                {
                  case: { $eq: ["$marketType", 3] },
                  then: "Fancy",
                },
              ],
              default: "Unknown",
            },
          },
          profitLoss: {
            $round: [
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$marketType", 1] },
                      then: {
                        $cond: {
                          if: { $eq: ["$selectionId", "$trade.winner"] },
                          then: {
                            $cond: {
                              if: { $eq: ["$type", "back"] },
                              then: { $multiply: [{ $subtract: ["$odds", 1] }, "$stake"] },
                              else: { $multiply: [{ $subtract: ["$odds", 1] }, -1, "$stake"] }
                            }
                          },
                          else: {
                            $cond: {
                              if: { $eq: ["$type", "back"] },
                              then: { $multiply: [{ $subtract: ["$odds", 1] }, -1, "$stake"] },
                              else: { $multiply: [{ $subtract: ["$odds", 1] }, "$stake"] }
                            }
                          }
                        }
                      },

                    },
                    {
                      case: { $eq: ["$marketType", 2] },
                      then: {
                        $cond: {
                          if: { $eq: ["$selectionId", "$trade.winner"] },
                          then: {
                            $cond: {
                              if: { $eq: ["$trade.backUserId", "$userId"] },
                              then: { $divide: [{ $multiply: ["$odds", "$stake"] }, 100] },
                              else: { $multiply: ["$liability", -1] }
                            }
                          },
                          else: {
                            $cond: {
                              if: { $eq: ["$trade.backUserId", "$userId"] },
                              then: { $multiply: ["$liability", -1] },
                              else: "$stake"
                            }
                          }
                        }
                      },

                    },
                    {
                      case: { $eq: ["$marketType", 3] },
                      then: "$trade.pnl"
                    },
                  ],
                  default: 0
                },
              },
              2
            ]
          },
          createdAt: 1,
        },
      },
      { $match: childMatchConditions },
      {
        $facet: {
          result: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          totalCount: [{ $count: "total" }],
        }
      }
    ]);

    const response = {
      totalCount: result?.length ? (result[0].totalCount?.length > 0 ? result[0].totalCount[0].total : 0) : 0,
      result: result?.length ? (result[0].result || []) : []
    }

    return res.send(await helper.jsonresponse(true, "betting.betPlace", response));
  } catch (error) {
    return res.send(await helper.jsonresponse(null, error.message, []));
  }
}


// const  list_admin = async (req,res)=>{
//   console.log(req.params.token.id,"token");
//   let token = req.params.token.id
//   let list = await admin.aggregate([
//     {
//       $match: { _id: token }  // Start with the employee with _id 1 (Alice)
//     },
//     {
//       $graphLookup: {
//         from: "admins",            // Search the "employees" collection
//         startWith: "$_id",            // Start with the employee's _id
//         connectFromField: "_id",      // Current employee's _id
//         connectToField: "admin_id",  // Matching managerId field in employees
//         as: "reportingChain",         // Store the result in the "reportingChain" field
//         maxDepth: 3,                  // Limit the depth of the traversal to 3 levels
//         depthField: "level"           // Add a field "level" to indicate the depth of each employee
//       }
//     }
//   ])
//   res.status(200).send(await helper.jsonresponse(true,"data",list))
//   console.log(list.length,"list");
// }

const getLimitSettings = async (req, res) => {
  try {
    const settings = await siteSetting.findOne({}).select(['match', 'bookmark', 'fancy', 'controls']).lean();
    if (settings) {
      return res.send(await helper.jsonresponse(true, 'commonmessage.detailsfetchsuccess', settings))
    }
    return res.send(await helper.jsonresponse(false, 'commonmessage.recordNotFound', null))

  } catch (error) {
    console.log("🚀 ~ :1142 ~ setMinandMaxBet ~ error:", error)
    return res.send(await helper.jsonresponse(false, 'commonmessage.tryagainlater', null))
  }
}
const setMinandMaxBet = async (req, res) => {
  try {
    const { match, bookmark, fancy } = req.body;
    const updatedSettings = await siteSetting.findOneAndUpdate(
      {},
      { match, bookmark, fancy },
      { upsert: true, new: true } // upsert: create if not exists, new: return updated document
    );
    if (updatedSettings) {
      return res.send(await helper.jsonresponse(true, 'betting.minandmaxupdated', updatedSettings))
    }
    return res.send(await helper.jsonresponse(false, 'commonmessage.recordNotFound', null))

  } catch (error) {
    console.log("🚀 ~ :1142 ~ setMinandMaxBet ~ error:", error)
    return res.send(await helper.jsonresponse(false, 'commonmessage.tryagainlater', null))
  }
}

const updateControls = async (req, res) => {
  try {
    const { sportid, status } = req.body;
    const updatedSettings = await siteSetting.findOneAndUpdate(
      {
        "controls.sportid": sportid
      },
      {
        $set: {
          "controls.$.status": status
        }
      },
      { upsert: true, new: true } // upsert: create if not exists, new: return updated document
    );
    if (updatedSettings) {
      return res.send(await helper.jsonresponse(true, 'betting.controlsupdated', updatedSettings))
    }
    return res.send(await helper.jsonresponse(false, 'commonmessage.recordNotFound', null))

  } catch (error) {
    console.log("🚀 ~ :1142 ~ setMinandMaxBet ~ error:", error)
    return res.send(await helper.jsonresponse(false, 'commonmessage.tryagainlater', null))
  }
}

const createBanner = async (req, res) => {
  try {
    // let exist =  await banners.findOne({title:req.body.title, type: req.body.type, status:req.body.status });
    // if(exist){
    //     res.send(await helper.jsonresponse(false,'banners.bannerexist', null))
    // }else{
    if (req.body.title && req.body.description) {
      let content = {
        ...req.body
      }
      if (req.files && req.files.banner_image) {
        content.banner_image = req.files.banner_image[0].location;
      }
      // if (req.body.start_date) {
      //   content.start_date = new Date(req.body.start_date);
      // }
      // if (req.body.end_date) {
      //   content.end_date = new Date(req.body.end_date);
      // }
      await banners.findOneAndUpdate({}, { ...content }, { upsert: true, new: true })
        .then(async (data) => {
          res.send(await helper.jsonresponse(true, 'commonmessage.upload', data))
        })
        .catch(async (errorData) => {
          res.send(await helper.jsonresponse(null, errorData, null))

        })
    } else {
      return res.send(await helper.jsonresponse(false, 'register.missingparameters', null));
    }

    // }

  } catch (error) {
    res.send(await helper.jsonresponse(null, error.message, null))

  }
}

const bannerUpdate = async (req, res) => {
  try {
    let dataFound = await banners.findOne({ type: req.body.type, "content._id": req.body.banner_id });
    if (!dataFound) {
      res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
    } else {
      if (req.body.content || (req.files && req.files.banner_image) || req.body.start_date || req.body.end_date) {
        let content = {
          "content.$.content": req.body.content,
          "content.$.status": req.body.status,
        }
        if (req.files && req.files.banner_image) {
          content["content.$.banner_image"] = req.files.banner_image[0].location;
        }
        if (req.body.start_date) {
          content["content.$.start_date"] = new Date(req.body.start_date);
        }
        if (req.body.end_date) {
          content["content.$.end_date"] = new Date(req.body.end_date);
        }
        const data = await banners.findOneAndUpdate({ type: req.body.type, "content._id": req.body.banner_id }, { $set: content });
        if (data) {
          res.send(await helper.jsonresponse(true, 'commonmessage.updatesuccess', data))
        }
        else {
          res.send(await helper.jsonresponse(null, data.message, null))
        }
      } else {
        return res.send(await helper.jsonresponse(false, 'register.missingparameters', null));
      }
    }

  }

  catch (error) {
    res.send(await helper.jsonresponse(null, error, null))
  }
}

const bannerDelete = async (req, res) => {
  try {
    let dataFound = await banners.findOne({ type: req.body.type, "content._id": req.body.banner_id });
    if (!dataFound) {
      res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
    } else {

      const data = await banners.findOneAndUpdate({ type: req.body.type, "content._id": req.body.banner_id }, { $set: { "content.$.isDeleted": true } });
      if (data) {
        res.send(await helper.jsonresponse(true, 'commonmessage.updatesuccess', data))
      }
      else {
        res.send(await helper.jsonresponse(null, data.message, null))
      }
    }
  }

  catch (error) {
    res.send(await helper.jsonresponse(null, error, null))
  }
}

const getActiveBanners = async (req, res) => {
  try {
    let dataFound = await banners.find();
    if (dataFound.length > 0) {
      return res.send(await helper.jsonresponse(true, 'commonmessage.updatesuccess', dataFound))
    } else {
      return res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
    }
  }

  catch (error) {
    res.send(await helper.jsonresponse(null, error, null))
  }
}

const requestforgotpassword = async (req, res) => {
  try {
    user.findOne({ email: req.body.email, isDeleted: false })
      .then(async (userData) => {
        if (userData) {
          let eyncPassword = await encryption.decrypt(userData?.password)
          if (!eyncPassword || req.body.password != eyncPassword) return res.send(await helper.jsonresponse(false, 'resendmailotp.incorrectPassword', null))

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
            res.send(await helper.jsonresponse(true, 'forgotpassword.forgototpmailsuccess', responseData))
          }
          else {

            res.send(await helper.jsonresponse(false, 'resendmailotp.mailnotsend', null))
          }
        }
        else {
          res.send(await helper.jsonresponse(false, 'accountverify.usernotexists', null))
        }
      })
      .catch(async (userDataError) => {
        res.send(await helper.jsonresponse(null, userDataError.message, null))
      })
  } catch (error) {
    res.send(await helper.jsonresponse(null, error.message, null))
  }
}


const requestforgotpasswordVerify = async (req, res) => {
  try {
    user.findOne({ email: req.body.email, isDeleted: false })
      .then(async (userData) => {
        if (userData) {
          // let eyncPassword = await encryption.decrypt(userData?.password)
          // if (!eyncPassword || req.body.password != eyncPassword) return res.send(await helper.jsonresponse(false, 'resendmailotp.incorrectPassword', null))

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
            res.send(await helper.jsonresponse(true, 'forgotpassword.forgototpmailsuccess', responseData))
          }
          else {
            res.send(await helper.jsonresponse(false, 'resendmailotp.mailnotsend', null))
          }
        }
        else {
          res.send(await helper.jsonresponse(false, 'Enter Valid email', null))
        }
      })
      .catch(async (userDataError) => {
        res.send(await helper.jsonresponse(null, userDataError.message, null))
      })
  } catch (error) {
    res.send(await helper.jsonresponse(null, error.message, null))
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
        return res.send(await helper.jsonresponse(true, 'forgotpassword.paswordchangesuccess', null))
      } else {
        return res.send(await helper.jsonresponse(false, 'commonmessage.incorrectPassword', null))
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
      res.send(await helper.jsonresponse(true, 'chagedpassword.otpmailsuccess', { email: userDetails.email }))
    } else {
      console.log('Issue in sending mail')
    }
  }
  catch (error) {
    res.send(await helper.jsonresponse(null, error.message, null))
  }
}

const verifyChangePasswordOtp = async (req, res) => {
  try {
    const token = req.params.token
    const userDetails = await user.findOne({ _id: token.id })
    if (userDetails.email_otp == req.body.otp) {
      req.body.newPassword = await encryption.encrypt(req.body.newPassword)
      const updateUserPassword = await user.findOneAndUpdate({ _id: token.id }, { $set: { password: req.body.newPassword } })
      if (updateUserPassword) res.send(await helper.jsonresponse(true, 'forgotpassword.paswordchangesuccess', null))
    } else {
      res.send(await helper.jsonresponse(false, 'forgotpassword.invalidotp', null))
    }
  }
  catch (error) {
    res.send(await helper.jsonresponse(null, error.message, null))
  }
}

const getAllBanners = async (req, res) => {
  let dataFound = await banners.findOne({ type: req.body.type });
  if (dataFound.content.length > 0) {
    let data = [];
    for (let element of dataFound.content) {
      if (element.isDeleted == false) {
        data.push(element);
      }
    }
    if (data.length > 0) {
      res.send(await helper.jsonresponse(true, 'commonmessage.updatesuccess', data))
    } else {
      res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
    }

  } else {
    res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
  }
}


const getSingleBanner = async (req, res) => {
  try {
    let dataFound = await banners.findOne({ type: req.body.type, "content._id": req.body.banner_id });
    if (!dataFound) {
      res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
    } else {
      let data = [];
      for (let element of dataFound.content) {
        if (element.isDeleted == false && element._id == req.body.banner_id) {
          data.push(element);
        }
      }
      if (data.length > 0) {
        res.send(await helper.jsonresponse(true, 'commonmessage.updatesuccess', data))
      } else {
        res.send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null))
      }
    }

  }

  catch (error) {
    res.send(await helper.jsonresponse(null, error, null))
  }
}
export default {
  adminLogin,
  subadmincreate,
  create_admins_list,
  logOut,
  getUnreadMessage,
  updateUnreadMessage,
  transaction_his,
  admin_balns_create,
  admin_Transaction,
  userBetHistory,
  setMinandMaxBet,
  createBanner,
  bannerUpdate,
  getActiveBanners,
  getAllBanners,
  bannerDelete,
  getSingleBanner,
  getLimitSettings,
  updateControls,
  getProfile,
  requestforgotpassword,
  requestforgotpasswordVerify,
  sendMailtoTheUser,
  getOtpForChangePassword,
  verifyChangePasswordOtp
}
// list_admin




