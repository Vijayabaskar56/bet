import { helper } from "../helper/helper.js";
import { admin, blockedList, supportchat, suspendList } from "../model/adminModel.js";
import { transactionHistory, user, userActivities } from "../model/userModel.js"
import encryption from '../middleware/decryptEncrypt.js';
import mongoose from "mongoose";
const getAllUsers = async (req, res) => {
  try {
    const token = req.params.token
    // const fileType = req.params.downloadType
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(process.env.PAGE_SIZE, 10) || 5;
    const skip = (page - 1) * pageSize;
    const createdId = helper.getMongoType(token.id);
    const matchConditions = {
      $or: [],
      $and: [],
    };
    if (token?.role === 1 || token?.role === 2) {
      // Admin can view all users with the role filter if provided
      if (req?.query?.role) {
        matchConditions.$or.push({
          role: Number(req?.query?.role),
        });
      }
    }
    if (token?.role === 3) {
      if (Number(req?.query?.role) === 6) {
        const masterIds = await getAgentCreatedByMaster(token.id, 4);
        const usersIds = await Promise.all(
          masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5))
        )
        matchConditions.$or.push({
          createdBy: { $in: usersIds.flat() },
        });
      } else if (Number(req?.query?.role) === 5) {
        // const masterIds = await getAgentCreatedByMaster(token.id, 4);
        matchConditions.$or.push({
          createdBy: { $in: [helper.getMongoType(token.id)] },
          role: 5,
        });
      } else {
        matchConditions.$or.push({
          createdBy: createdId,
          role: 4
        });
      }
    }
    if (token?.role === 4) {
      if (Number(req?.query?.role) === 6) {
        const agentIds = await getAgentCreatedByMaster(token.id, 5);
        matchConditions.$or.push({
          createdBy: { $in: agentIds },
          role: 6,
        });
      } else {
        matchConditions.$or.push({
          createdBy: createdId,
          role: 5
        });
      }
    }
    if (token?.role === 5) {
      matchConditions.$or.push({
        createdBy: createdId,
        role: 6,
      });
    }
    console.log("🚀 ~ getAllUsers ~ req?.query:", req?.query)
    if (req?.query?.user_name && req?.query?.user_name !== 'null') {
      matchConditions.$and.push({
        user_name: { $regex: req?.query?.user_name, $options: 'i' },
      });
    }
    if (req?.query?.status && req?.query?.status !== 'null') {
      matchConditions.$and.push({
        status: Number(req?.query?.status),
      });
    }

    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }
    if (matchConditions.$and.length === 0) {
      delete matchConditions.$and;
    }
    console.log("🚀 ~ getAllUsers ~ matchConditions:", JSON.stringify(matchConditions, null, 2))
    const [userData, balanceDetails] = await Promise.all([
      user.aggregate([
        { $match: matchConditions },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "createdBy",
            as: "recursiveDownline",
            maxDepth: 5,
            depthField: "depth",
          },
        },
        {
          $addFields: {
            balanceDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$recursiveDownline",
                      as: "user",
                      in: {
                        $add: [
                          "$$user.balance",
                          "$$user.escrowBalance",
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "transaction_histories",
            let: {
              parent: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $addFields: {
                  child: "$sender_id",
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$child", "$$parent"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalDeposits: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 1],
                        },
                        // Deposit transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                  totalWithdrawals: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 2],
                        },
                        // Withdrawal transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "transactionSummary",
          },
        },
        {
          $addFields: {
            creditReference: {
              $subtract: [
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalDeposits",
                    0,
                  ],
                },
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalWithdrawals",
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "createdBy",
            as: "downlineUsers",
          },
        },
        {
          $addFields: {
            balanceInDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$downlineUsers",
                      as: "user",
                      in: {
                        $add: ["$$user.balance", "$$user.escrowBalance"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            referencePandL: {
              $subtract: [
                "$balanceInDownline",
                "$creditReference",
              ],
            },
          },
        },
        {
          $addFields: {
            totalBalance: {
              $add: [
                "$balanceDownline",
                "$balance",
              ],
            },
          },
        },
        {
          $project: {
            user_name: 1,
            status: 1,
            createdBy: 1,
            createdAt: 1,
            email: 1,
            userCount: 1,
            role: 1,
            casino_block: 1,
            creditReference: { $ifNull: ["$creditReference", 0] },
            balance: { $ifNull: ["$balanceDownline", 0] },
            availableBalance: { $ifNull: ["$balance", 0] },
            exposure: { $ifNull: ["$exposure", 0] },
            referencePandL: { $ifNull: ['$referencePandL', 0] },
            totalBalance: { $ifNull: ['$totalBalance', 0] },
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
      ]),
      user.aggregate([
        {
          $match: {
            createdBy: helper.getMongoType(token.id)
          },
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "createdBy",
            as: "recursiveDownline",
            maxDepth: 5,
            depthField: "depth",
          },
        },
        {
          $addFields: {
            balanceDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$recursiveDownline",
                      as: "user",
                      in: {
                        $add: [
                          "$$user.balance",
                          "$$user.escrowBalance",
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "transaction_histories",
            let: {
              parent: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $addFields: {
                  child: "$sender_id",
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$child", "$$parent"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalDeposits: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 1],
                        },
                        // Deposit transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                  totalWithdrawals: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 2],
                        },
                        // Withdrawal transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "transactionSummary",
          },
        },
        {
          $addFields: {
            creditReference: {
              $subtract: [
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalDeposits",
                    0,
                  ],
                },
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalWithdrawals",
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "createdBy",
            as: "downlineUsers",
          },
        },
        {
          $addFields: {
            balanceInDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$downlineUsers",
                      as: "user",
                      in: {
                        $add: ["$$user.balance", "$$user.escrowBalance"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            referencePandL: {
              $subtract: [
                "$balanceInDownline",
                "$creditReference",
              ],
            },
          },
        },
        {
          $addFields: {
            totalBalance: {
              $add: [
                "$balanceDownline",
                "$balance",
              ],
            },
          },
        },
        {
          $project: {
            user_name: 1,
            status: 1,
            createdBy: 1,
            createdAt: 1,
            email: 1,
            userCount: 1,
            role: 1,
            userBalance: "$balance",
            casino_block: 1,
            creditReference: { $ifNull: ["$creditReference", 0] },
            balance: { $ifNull: ["$balanceDownline", 0] },
            availableBalance: { $ifNull: ["$balance", 0] },
            exposure: { $ifNull: ["$exposure", 0] },
            referencePandL: { $ifNull: ['$referencePandL', 0] },
            totalBalance: { $ifNull: ['$totalBalance', 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalCrediReference: {
              $sum: "$creditReference",
            },
            balance: {
              $sum: "$userBalance"
            },
            totalBalanceInDownline: {
              $sum: "$totalBalance"
            },
            totalReferencePandL: {
              $sum: "$referencePandL"
            }
          }
        },
        {
          $addFields: {
            totalBalance: {
              $sum: [
                '$totalCrediReference',
                '$balance'
              ]
            }
          }
        },
        {
          $project: {
            totalCrediReference: 1,
            balance: 1,
            totalBalanceInDownline: 1,
            totalReferencePandL: 1,
            totalBalance: 1,
          }
        }
      ])
    ])
    const [userResult] = userData
    const [balanceResult] = balanceDetails

    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { ...userResult, balanceResult: balanceResult, totalCount: userResult.totalCount[0]?.total }))
  } catch (error) {
    return res.status(500).send(await helper.jsonresponse(null, error.message, null))
  }
}

const updateUserStatus = async (req, res) => {
  const token = req.params.token
  const { id: userId, status } = req.body
  let message
  try {
    if (token.id) {
      const userData = await user.findById(userId)
      if (req.body.status !== 4 || req.body.status !== 5) {
        let decryptPassword = await encryption.decrypt(userData.password)
        console.log("🚀 ~ updateUserStatus ~ decryptPassword:", decryptPassword, req.body.password)
        if (decryptPassword === req.body.password) return res.status(200).send(await helper.jsonresponse(false, 'commonmessage.incorrectPassword', null))
        if (!userData) return res.status(200).send(await helper.jsonresponse(false, 'accountverify.usernotexists', null))
      }
      if (req.body.status === 1) {
        await user.findOneAndUpdate({ _id: userId }, { status: 1, authToken: null })
        message = 'Your are Activated, Sorry for the inconvence'
        res.status(200).send(await helper.jsonresponse(true, "commonmessage.activesuccess", null))
      } else if (req.body.status === 2) {
        await user.findByIdAndUpdate(userId, { issuspend: true, status: 2, authToken: null })
        message = 'Your are Suspended , Please Contact the Support'
        res.status(200).send(await helper.jsonresponse(true, "commonmessage.suspendsuccess", null))
      } else if (req.body.status === 3) {
        await user.findOneAndUpdate({ _id: userId }, { status: 3, authToken: null })
        message = 'Your are Blocked, Please Contact the Support'
        res.status(200).send(await helper.jsonresponse(true, "commonmessage.blockeduser", null))
      }

      if (req.body.casino_block === true || req.body.casino_block === false) {
        const data = await user.findOneAndUpdate({ _id: userId }, { casino_block: req.body.casino_block })
        message = req.body.casino_block ? 'Your are Account is Blocked From Using Casino, Please Contact the Support' : 'Your are Account is Blocked From Using Casino, Please Contact the Support'
        if (data.casino_block) {
          res.status(200).send(await helper.jsonresponse(true, "commonmessage.casinolocked", null))
        } else {
          res.status(200).send(await helper.jsonresponse(true, "commonmessage.casinoUnlocked", null))
        }
      }

      const getParams = {
        'email': userData.email,
        'username': userData.user_name,
        'reason': message,
        'subject': `Your Account has been ${status === 1 ? 'Activated' : status === 2 ? 'Suspended' : "Blocked"}`,
        'app_name': process.env.APP_NAME,
        // 'template': 'suspendedUser',
        'support_mail': process.env.SUPPORTMAIL,
        'image_path': process.env.IMAGEURL,
        'mail_footer': process.env.MAIL_FOOTER
      }
      const sendmail = await helper.sendMail(getParams)
      if (sendmail.status == true) {
        console.log('Mail sent successfully');
      } else {
        console.log('Mail not send');
      }
    } else {
      res.status(200).send(await helper.jsonresponse(false, 'token.tokennotfound', null))
    }
  } catch (error) {
    res.status(500).send(await helper.jsonresponse(false, 'token.tokennotfound', error.message))
  }
}


const getSuspendAndBlockLists = async (req, res) => {
  const page = req.query.page
  const type = req.body.type
  const token = req.params.token
  const createdId = new helper.getMongoType(token?.id)
  const matchConditions = {
    $or: [],
    $and: [],
  };
  if (token?.role === 1 || token?.role === 2) {
    // Admin can view all users with the role filter if provided
    if (req?.query?.role) {
      matchConditions.$or.push({
        role: Number(req?.query?.role),
      });
    }
  }
  if (token?.role === 3) {
    if (Number(req?.query?.role) === 6) {
      const masterIds = await getAgentCreatedByMaster(token.id, 4);
      const usersIds = await Promise.all(
        masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5))
      )
      matchConditions.$or.push({
        createdBy: { $in: usersIds.flat() },
      });
    } else if (Number(req?.query?.role) === 5) {
      const masterIds = await getAgentCreatedByMaster(token.id, 4);
      matchConditions.$or.push({
        createdBy: { $in: masterIds },
        role: 5,
      });
    } else {
      matchConditions.$or.push({
        createdBy: createdId,
        role: 4
      });
    }
  }
  if (token?.role === 4) {
    if (Number(req?.query?.role) === 6) {
      const agentIds = await getAgentCreatedByMaster(token.id, 5);
      matchConditions.$or.push({
        createdBy: { $in: agentIds },
        role: 6,
      });
    } else {
      matchConditions.$or.push({
        createdBy: createdId,
        role: 5
      });
    }
  }
  if (token?.role === 5) {
    matchConditions.$or.push({
      createdBy: createdId,
      role: 6,
    });
  }
  if (req?.query?.user_name) {
    matchConditions.$and.push({
      user_name: { $regex: req?.query?.user_name, $options: 'i' },
    });
  }
  const model = type == 1 ? suspendList : blockedList
  if (type && (type == 1 || type == 2)) {
    const result = await model.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          "from": "users",
          "let": { "parent": "$user_id" },
          "pipeline": [
            { $addFields: { "child": { "$toString": "$_id" } } },
            { $match: { $expr: { $eq: ['$$parent', '$child'] } } }
          ],
          "as": "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails"
        }
      },
      {
        $project: {
          user_id: 1,
          reason: 1,
          end_date: { $cond: { if: '$end_date', then: '$end_date', else: null } },
          createdAt: 1,
          status: 1,
          user_name: "$userDetails.user_name",
          email: "$userDetails.email",
          mobile_number: "$userDetails.mobile_number",
          updatedAt: 1
        }
      },
      {
        $match: {
          $and: [
            { user_name: req.body.user_name ? { $regex: req.body.user_name, $options: 'i' } : { $exists: true } },
            { email: req.body.email ? req.body.email : { $exists: true } }
          ]
        }
      },
      { $sort: { updatedAt: -1 } }
    ])
    let totalCount = result.length
    const responseData = await helper.paginate(result, page)
    if (result.length == 0) return res.status(200).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', { responseData, totalCount }))
    res.status(200).send(await helper.jsonresponse(true, 'commonmessage.detailsfetchsuccess', { responseData, totalCount }))
  } else {
    if (!type) return res.status(200).send(await helper.jsonresponse(null, 'Please mention the type', null))
    res.status(200).send(await helper.jsonresponse(null, 'Please mention the correct type', null))
  }
}

const blockUser = async (req, res) => {
  const token = req.params.token
  const userId = req.body.id
  const blocked = req.body.blocked
  // const reason = req.body.reason
  const userDetails = await user.findById(userId)
  if (token.id) {
    if (!userDetails) return res.status(200).send(await helper.jsonresponse(false, 'accountverify.usernotexists', null))
    let decryptPassword = await encryption.decrypt(userDetails.password)
    if (decryptPassword === req.body.password) return res.status(200).send(await helper.jsonresponse(false, 'commonmessage.incorrectPassword', null))
    const getUnblockedData = await blockedList.find({ user_id: userDetails.id, status: false })
    const getBlockedData = await blockedList.findOne({ user_id: userDetails.id, status: true })
    if (getUnblockedData.length >= 0 && blocked == true) {
      let createData = {
        user_id: userDetails.id,
        status: blocked,
        // reason: reason,
      }
      await blockedList.create(createData)
      let userData = await user.findOneAndUpdate({ _id: userId }, { isBlocked: blocked, status: 3, authToken: null })
      res.status(200).send(await helper.jsonresponse(true, "commonmessage.blockeduser", null))
      var getParams = {
        'email': userData.email,
        'username': userData.user_name,
        // 'reason': reason,
        'subject': 'Locked for Illegal Activities',
        'app_name': process.env.APP_NAME,
        'template': 'blockedUser',
        'support_mail': process.env.SUPPORTMAIL,
        'image_path': process.env.IMAGEURL,
        'mail_footer': process.env.MAIL_FOOTER
      }
      const sendmail = await helper.sendMail(getParams)
      if (sendmail.status == true) {
        console.log('Mail sent successfully');
      } else {
        console.log('Mail not send');
      }
    } else if (blocked == false) {
      if (getBlockedData) {
        await blockedList.findOneAndUpdate({ user_id: userId, status: true }, { status: blocked })
        await user.findOneAndUpdate({ _id: userId }, { isBlocked: blocked, status: 1 })
        res.status(200).send(await helper.jsonresponse(true, "commonmessage.unblockuser", null))
      } else {
        res.status(200).send(await helper.jsonresponse(false, "commonmessage.alreadyunblock", null))
      }
    }
  } else {
    res.status(200).send(await helper.jsonresponse(false, "login.adminnotfound", null))
  }
}

const getAgentCreatedByMaster = async (masterId, role) => {
  const agents = await user.find({ createdBy: masterId, role }, { _id: true });
  return agents.map(agent => agent._id);
}

const getSubUser = async (req, res) => {
  try {
    const token = req.params.token
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(process.env.PAGE_SIZE, 10) || 5;
    const skip = (page - 1) * pageSize;
    const { user_id } = req.query
    const createdId = helper.getMongoType(user_id);
    const matchConditions = {
      $or: [{ createdBy: createdId }],
      $and: [],
    };

    if (req?.query?.user_name && req?.query?.user_name !== 'null') {
      matchConditions.$and.push({
        user_name: { $regex: req?.query?.user_name, $options: 'i' },
      });
    }
    if (req?.query?.status && req?.query?.status !== 'null') {
      matchConditions.$and.push({
        status: Number(req?.query?.status),
      });
    }
    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }

    if (matchConditions.$and.length === 0) {
      delete matchConditions.$and;
    }

    const [userData, balanceDetails] = await Promise.all([
      user.aggregate([
        { $match: matchConditions },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            // Start with the current user's ID
            connectFromField: "_id",
            // Find users created by the current user
            connectToField: "createdBy",
            // Look for users whose `createdBy` field matches the current user's `_id`
            as: "recursiveDownline",
            // Store the resulting users in this array
            maxDepth: 5,
            // Set a max depth based on your roles, can be adjusted
            depthField: "depth", // Optional field to store the depth of each user in the hierarchy
          },
        },
        {
          $addFields: {
            balanceDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$recursiveDownline",
                      as: "user",
                      in: {
                        $add: [
                          "$$user.balance",
                          "$$user.escrowBalance",
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "transaction_histories",
            let: {
              parent: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $addFields: {
                  child: "$sender_id",
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$child", "$$parent"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalDeposits: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 1],
                        },
                        // Deposit transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                  totalWithdrawals: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 2],
                        },
                        // Withdrawal transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "transactionSummary",
          },
        },
        {
          $addFields: {
            creditReference: {
              $subtract: [
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalDeposits",
                    0,
                  ],
                },
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalWithdrawals",
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "createdBy",
            as: "downlineUsers",
          },
        },
        {
          $addFields: {
            balanceInDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$downlineUsers",
                      as: "user",
                      in: {
                        $add: ["$$user.balance", "$$user.escrowBalance"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            referencePandL: {
              $subtract: [
                "$balanceInDownline",
                "$creditReference",
              ],
            },
          },
        },
        {
          $addFields: {
            totalBalance: {
              $add: [
                "$balanceDownline",
                "$balance",
              ],
            },
          },
        },
        {
          $project: {
            user_name: 1,
            status: 1,
            createdBy: 1,
            createdAt: 1,
            email: 1,
            userCount: 1,
            role: 1,
            casino_block: 1,
            creditReference: { $ifNull: ["$creditReference", 0] },
            balance: { $ifNull: ["$balanceDownline", 0] },
            availableBalance: { $ifNull: ["$balance", 0] },
            exposure: { $ifNull: ["$exposure", 0] },
            referencePandL: { $ifNull: ['$referencePandL', 0] },
            totalBalance: { $ifNull: ['$totalBalance', 0] },
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
      ]),
      user.aggregate([
        {
          $match: {
            createdBy: createdId
          },
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "createdBy",
            as: "recursiveDownline",
            maxDepth: 5,
            depthField: "depth",
          },
        },
        {
          $addFields: {
            balanceDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$recursiveDownline",
                      as: "user",
                      in: {
                        $add: [
                          "$$user.balance",
                          "$$user.escrowBalance",
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "transaction_histories",
            let: {
              parent: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $addFields: {
                  child: "$sender_id",
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$child", "$$parent"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalDeposits: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 1],
                        },
                        // Deposit transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                  totalWithdrawals: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 2],
                        },
                        // Withdrawal transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "transactionSummary",
          },
        },
        {
          $addFields: {
            creditReference: {
              $subtract: [
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalDeposits",
                    0,
                  ],
                },
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalWithdrawals",
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "createdBy",
            as: "downlineUsers",
          },
        },
        {
          $addFields: {
            balanceInDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$downlineUsers",
                      as: "user",
                      in: {
                        $add: ["$$user.balance", "$$user.escrowBalance"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            referencePandL: {
              $subtract: [
                "$balanceInDownline",
                "$creditReference",
              ],
            },
          },
        },
        {
          $addFields: {
            totalBalance: {
              $add: [
                "$balanceDownline",
                "$balance",
              ],
            },
          },
        },
        {
          $project: {
            user_name: 1,
            status: 1,
            createdBy: 1,
            createdAt: 1,
            email: 1,
            userCount: 1,
            role: 1,
            userBalance: "$balance",
            casino_block: 1,
            creditReference: { $ifNull: ["$creditReference", 0] },
            balance: { $ifNull: ["$balanceDownline", 0] },
            availableBalance: { $ifNull: ["$balance", 0] },
            exposure: { $ifNull: ["$exposure", 0] },
            referencePandL: { $ifNull: ['$referencePandL', 0] },
            totalBalance: { $ifNull: ['$totalBalance', 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalCrediReference: {
              $sum: "$creditReference",
            },
            balance: {
              $sum: "$userBalance"
            },
            totalBalanceInDownline: {
              $sum: "$totalBalance"
            },
            totalReferencePandL: {
              $sum: "$referencePandL"
            }
          }
        },
        {
          $addFields: {
            totalBalance: {
              $sum: [
                '$totalCrediReference',
                '$balance'
              ]
            }
          }
        },
        {
          $project: {
            totalCrediReference: 1,
            balance: 1,
            totalBalanceInDownline: 1,
            totalReferencePandL: 1,
            totalBalance: 1,
          }
        }
      ])])
    const [result] = userData
    const [balanceResult] = balanceDetails
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { ...result, balanceResult, role: token.role + 1, totalCount: result.totalCount[0]?.total }))
  } catch (error) {
    return res.status(500).send(await helper.jsonresponse(false, "commonmessage.success", error.messag))
  }
}



const getDashboardData = async (req, res) => {
  const token = req.params.token
  const pageActivites = parseInt(req.query.pageActivites, 10) || 1;
  const pageTransaction = parseInt(req.query.pageTransaction, 10) || 1;
  const pageSizeTransaction = parseInt(req.body.pageTransaction, 10) || 5;
  const pageSizeActivites = parseInt(req.body.pageActivites, 10) || 5;
  const skipTransaction = (pageTransaction - 1) * pageSizeTransaction;
  const skipActivites = (pageActivites - 1) * pageSizeActivites;
  const matchConditions = {
    $or: [],
  };
  const matchConditionsTwo = {
    $or: [],
  };
  const userInfo = await user.findById(helper.getMongoType(req.body.user_id ? req.body.user_id : token.id))
  const userActivitesCondition = req.body.user_id ? req.body.user_id : token.id
  if (req.body.user_id) {
    matchConditionsTwo.$or.push({
      sender_id: req.body.user_id
    });
    matchConditionsTwo.$or.push({
      receiver_id: req.body.user_id
    });
  } else {
    matchConditionsTwo.$or.push({
      sender_id: token.id
    });
    matchConditionsTwo.$or.push({
      receiver_id: token.id
    });
  }

  if (req.body.user_id) {
    matchConditions.$or.push({
      _id: helper.getMongoType(req.body.user_id)
    });
  } else {
    matchConditions.$or.push({
      _id: helper.getMongoType(token.id)
    });
  }

  if (matchConditions.$or.length === 0) {
    delete matchConditions.$or;
  }
  if (matchConditionsTwo.$or.length === 0) {
    delete matchConditionsTwo.$or;
  }
  try {
    const [userData, transactionHistoryData, userActivitieData] = await Promise.all([
      user.aggregate([
        {
          $match: matchConditions
        },
        {
          $project: {
            user_name: 1,
            email: 1,
            usersDetails: 1,
            kyc_verify: 1,
            kyc_level: 1,
            mobile_number: 1,
            role: 1,
            // issuspend:1,
            status: 1,
            lastSeen: 1,
            profile_img: 1,
            balance: 1,
            escrowBalance: 1,
            address: 1,
            city: 1
          }
        }
      ]),
      transactionHistory.aggregate([
        {
          $match: matchConditionsTwo
        },
        {
          // Step 1: Add dynamic fields for each transaction type
          $addFields: {
            deposite_to_downline: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$type", 1] },
                    { $gt: ["$sender_role", userInfo ? userInfo.role : token.role] }
                  ]
                },
                then: "$amount",
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ["$type", 1] },
                        { $gt: ["$receiver_role", userInfo ? userInfo.role : token.role] }
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
                    { $lt: ["$sender_role", userInfo ? userInfo.role : token.role] }
                  ]
                },
                then: "$amount",
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ["$type", 1] },
                        { $lt: ["$receiver_role", userInfo ? userInfo.role : token.role] }
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
                    { $gt: ["$sender_role", userInfo ? userInfo.role : token.role] }
                  ]
                },
                then: "$amount",
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ["$type", 2] },
                        { $gt: ["$receiver_role", userInfo ? userInfo.role : token.role] }
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
                    { $lt: ["$sender_role", userInfo ? userInfo.role : token.role] }
                  ]
                },
                then: "$amount",
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ["$type", 2] },
                        { $lt: ["$receiver_role", userInfo ? userInfo.role : token.role] }
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
              { $skip: skipTransaction },
              { $limit: pageSizeTransaction },
            ],
          },
        },
      ]),
      userActivities.aggregate([{
        $match: {
          user_id: userActivitesCondition
        }
      }, {
        $project: {
          user_id: 1,
          ipaddress: 1,
          city: 1,
          country: 1,
          status: 1,
          type: 1,
          browser: 1,
          os: 1,
          createdAt: 1,
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          pagedData: [
            { $sort: { createdAt: -1 } },
            { $skip: skipActivites },
            { $limit: pageSizeActivites },
          ],
        },
      }])
    ])
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { userData, transactionHistoryData, userActivitieData }))
  } catch (error) {
    return res.status(500).send(await helper.jsonresponse(false, "commonmessage.success", error.messag))
  }
}


const transferMoney = async (req, res) => {
  try {
    const token = req.params.token;
    let message, subject;
    const { amount, user_id, transactionType } = req.body;

    if (!token.id) {
      return res.status(200).send(await helper.jsonresponse(false, 'token.tokennotfound', null));
    }

    const userData = await user.findOne({ _id: token.id }, { status: 1 });
    if (!userData) {
      return res.status(200).send(await helper.jsonresponse(false, 'transaction.notActive', null));
    }

    if (transactionType === 'withdrawal' && userData.balance < amount) {
      return res.status(200).send(await helper.jsonresponse(false, 'transaction.insufficientbalance', null));
    }

    const roleMap = {
      1: {
        action: async () => handleTransaction(admin, user_id, amount, token.role, transactionType, token.role, null, 'admin transaction')
      },
      2: {
        action: async () => handleTransaction(user, user_id, amount, token.role, transactionType, token.role, null, 'user transaction')
      },
      3: {
        action: async () => handleTransaction(user, user_id, amount, token.role, transactionType, token.role, null, 'user transaction')
      },
      4: {
        action: async () => handleTransaction(user, user_id, amount, token.role, transactionType, token.role, null, 'user transaction')
      },
    };

    if (roleMap[token.role]) {
      const result = await roleMap[token.role].action();
      message = result.message;
      subject = result.subject;
    } else {
      return res.status(200).send(await helper.jsonresponse(false, 'login.roleincorrect', null));
    }

    // Prepare email parameters for transaction
    const getParams = {
      'email': userData.email,
      'username': userData.user_name,
      'reason': message,
      'subject': `Your Account has been ${subject}`,
      'app_name': process.env.APP_NAME,
      'support_mail': process.env.SUPPORTMAIL,
      'image_path': process.env.IMAGEURL,
      'mail_footer': process.env.MAIL_FOOTER
    };

    // Send email notification
    const sendmail = await helper.sendMail(getParams);
    if (sendmail.status === true) {
      console.log('Mail sent successfully');
    } else {
      console.log('Mail not sent');
    }

    res.status(200).send(await helper.jsonresponse(true, 'profile.profilefetchsuccess', token));
  }
  catch (error) {
    res.status(500).send(await helper.jsonresponse(false, error.message, null));
  }
};

const handleTransaction = async (userModel, userId, amount, tokenRole, transactionType, userRole, fromTo = null, remarks = '') => {
  // Retrieve user details
  const userdetails = await userModel.findOne({ _id: userId });

  // Check if user exists and has sufficient balance for withdrawal
  if (transactionType === 'withdrawal' && userdetails.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // Update user balance based on the transaction type
  let updatedBalance;
  if (transactionType === 'deposit') {
    updatedBalance = userdetails.balance + amount; // Increase balance for deposit
  } else if (transactionType === 'withdrawal') {
    updatedBalance = userdetails.balance - amount; // Decrease balance for withdrawal
  }

  // Perform balance update in the database
  const updatedUser = await userModel.findOneAndUpdate(
    { _id: userId },
    { balance: updatedBalance },
    { new: true }
  );

  // Calculate the remaining balance (optional: adjust logic based on your requirements)
  const remainingBalance = updatedUser.balance;

  // Define the transaction data based on the role comparison
  let transactionData = {};
  if (transactionType === 'deposit') {
    if (userRole <= tokenRole) {
      transactionData = {
        deposite_by_downline: amount,
        withdraw_by_downline: 0,
      };
    } else if (userRole >= tokenRole) {
      transactionData = {
        deposite_by_upline: amount,
        withdraw_by_upline: 0,
      };
    }
  } else if (transactionType === 'withdrawal') {
    if (userRole <= tokenRole) {
      transactionData = {
        deposite_by_downline: 0,
        withdraw_by_downline: amount,
      };
    } else if (userRole >= tokenRole) {
      transactionData = {
        deposite_by_upline: 0,
        withdraw_by_upline: amount,
      };
    }
  }

  // Create transaction history entry for both deposit and withdrawal
  await transactionHistory.create({
    ...transactionData,
    remaining_balance: remainingBalance,
    from_to: fromTo,
    remarks,
    user_id: updatedUser._id
  });

  // Return a response with the transaction details
  let subject = transactionType === 'deposit' ? 'Activated' : 'Withdrawn';
  return { message: `Rupees ${amount} ${transactionType === 'deposit' ? 'Deposited' : 'Withdrawn'}`, subject };
};

const getUnreadMessage = async (req, res) => {
  try {
    const token = req.params.token
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 5;
    const skip = (page - 1) * pageSize;
    const createdId = helper.getMongoType(token.id);
    let subAdminDetailsCount
    let subAdminDetails
    const matchConditions = {
      $or: [],
      $and: [],
    };
    if (token.role === 1) {
      const adminId = token.id;
      subAdminDetails = await admin.find({ admin_id: adminId }, {
        _id: 1,
        name: 1,
        status: 1,
        role: 1,
        balance: 1,
      });
      subAdminDetailsCount = await admin.countDocuments({ admin_id: adminId });
      const subadmin = subAdminDetails.map(agent => agent._id);
      const superMasterIds = await Promise.all(subadmin.map(superMasterId => getAgentCreatedByMaster(superMasterId, 3)));
      const masterIds = await Promise.all(superMasterIds.map(superMasterId => getAgentCreatedByMaster(superMasterId, 4)));
      const agentIds = await Promise.all(masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5)));
      // const userIds = await Promise.all(agentIds.map(agentId => getAgentCreatedByMaster(agentId, 6)));

      const allCreatedBy = [
        ...superMasterIds.flat(),
        ...masterIds.flat(),
        ...agentIds.flat(),
      ];

      matchConditions.$or.push({
        createdBy: { $in: allCreatedBy }
      });
    }
    if (token?.role === 2) {  // subadmin
      const adminId = token.id;
      const superMasterIds = await getAgentCreatedByMaster(adminId, 3);
      const masterIds = await Promise.all(superMasterIds.map(superMasterId => getAgentCreatedByMaster(superMasterId, 4)));
      const agentIds = await Promise.all(masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5)));

      const allCreatedBy = [
        ...superMasterIds,
        ...masterIds.flat(),
        ...agentIds.flat(),
      ];

      matchConditions.$or.push({
        createdBy: { $in: allCreatedBy }
      });
    }

    if (token?.role === 3) {
      matchConditions.$or.push({
        createdBy: { $in: [helper.getMongoType(token.id)] },
      });
    }

    if (token?.role === 4) {
      matchConditions.$or.push({
        createdBy: { $in: [helper.getMongoType(token.id)] },
      });
    }

    if (token?.role === 5) {  // agent
      matchConditions.$or.push({
        createdBy: createdId,
        role: 6,  // user creates "role: 6" (or similar condition)
      });
    }

    if (req?.query?.user_name && req?.query?.user_name !== 'null') {
      matchConditions.$and.push({
        user_name: { $regex: req?.query?.user_name, $options: 'i' },
      });
    }
    if (req?.query?.status && req?.query?.status !== 'null') {
      matchConditions.$and.push({
        status: Number(req?.query?.status),
      });
    }

    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }

    if (matchConditions.$and.length === 0) {
      delete matchConditions.$and;
    }
    const usersWithUnreadMessages = await user.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "supportchats",
          let: { parent: { "$toString": "$_id" } },
          pipeline: [
            { $addFields: { child: "$sender_id" } },
            { $match: { $expr: { $eq: ["$child", "$$parent"] } } },
            {
              $project: {
                _id: 0,
                unreadChats: {
                  $filter: {
                    input: "$chats",
                    as: "chat",
                    cond: { $eq: ["$$chat.readedAt", null] } // Filter chats with readedAt as null
                  }
                }
              }
            },
            {
              $project: {
                totalUnreadChats: { $size: "$unreadChats" } // Count of unread chats
              }
            }
          ],
          as: 'supportChats'
        }
      },
      {
        $unwind: { path: "$supportChats", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: "$_id", // Group by the main document's ID
          user_name: { $first: "$user_name" },
          email: { $first: "$email" },
          email_id: { $first: "$email_id" },
          name: { $first: "$name" },
          createdAt: { $first: "$createdAt" },
          role: { $first: "$role" },
          unreadMessage: { $sum: { $ifNull: ["$supportChats.totalUnreadChats", 0] } } // Sum unread messages
        }
      },
      {
        $project: {
          user_name: 1,
          email: 1,
          email_id: 1,
          name: 1,
          totalChats: 1,
          createdAt: 1,
          role: 1,
          unreadMessage: 1 // Final count of unread messages
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
            { $skip: skip },
            { $limit: pageSize }
          ]
        }
      }
    ]);
    const [result] = usersWithUnreadMessages
    const structuredData = subAdminDetails ? [...result.pagedData, ...subAdminDetails] : result.pagedData
    const data = helper.paginate(structuredData, page)
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { pageData: data, totalCount: subAdminDetailsCount ? result.totalCount[0]?.total + subAdminDetailsCount : result.totalCount[0]?.total }))
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
      return res.status(401).send(await helper.jsonresponse(false, 'commonmessage.norecordsfound', null));
    }

    chatThread.chats.forEach(chat => {
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


const getChatHistory = async (req, res) => {
  try {
    const childId = req.params.userId;
    const token = req.params.token
    const senderId = childId ? childId : token.id;
    const userData = await user.findOne({ _id: token.id })
    const adminData = await admin.findOne({ _id: token.id })
    const receiverId = childId ? token.id : userData?.createdBy ?? adminData?.admin_id;
    const matchCondition = childId
      ? {
        $or: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId },
        ],
      }
      : {
        $or: [
          { sender_id: senderId },
          { receiver_id: senderId },
        ],
      };
    const chatHistory = await supportchat.aggregate([
      {
        $match: matchCondition,
      },
      {
        $addFields: {
          chats: {
            $map: {
              input: "$chats",
              as: "chat",
              in: {
                sender_id: "$$chat.sender_id",
                receiver_id: "$$chat.receiver_id",
                message: "$$chat.message",
                image: "$$chat.image",
                time: "$$chat.time",
                type: "$$chat.type",
                msgFrom: "$$chat.msgFrom"
              },
            },
          },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);
    if (!chatHistory.length) {
      return res.status(401).send(await helper.jsonresponse(true, 'commonmessage.noMessage', null))
    }

    const [result] = chatHistory
    let modify = await Promise.all(
      result.chats.map(async (v) => {
        const sender_name_user = await user.findOne({ _id: v.sender_id }, { user_name: true })
        const receiver_name_user = await user.findOne({ _id: v.receiver_id }, { user_name: true })
        const sender_name_admin = await admin.findOne({ _id: v.sender_id }, { name: true })
        const recieiver_name_admin = await admin.findOne({ _id: v.receiver_id }, { name: true })
        return {
          ...v,
          type: token.id === v.sender_id ? 1 : 2,
          sender_name: sender_name_user.user_name ?? sender_name_admin.name,
          receiver_name: receiver_name_user.user_name ?? recieiver_name_admin.name,
        }
      })
    )
    console.log(result.chats);


    res.status(200).send(await helper.jsonresponse(true, 'commonmessage.success', { data: modify, user_id: token.id }));
  } catch (error) {
    console.log(error);
    res.status(500).send(await helper.jsonresponse(false, 'commonmessage.failure', error.message));
  }
}

const getBalanceDetails = async (req, res) => {
  try {

    const token = req.params.token
    const page = parseInt(req.query.page || 1, 10);
    const pageSize = parseInt(process.env.PAGE_SIZE || 5, 10);
    const skip = (page - 1) * pageSize;
    const createdId = helper.getMongoType(token.id);
    let subAdminDetailsCount
    let subAdminDetails
    const matchConditions = {
      $or: [],
      $and: [],
    };
    if (token.role === 1) {
      const adminId = token.id;
      subAdminDetails = await admin.find({ admin_id: adminId }, {
        _id: 1,
        name: 1,
        status: 1,
        role: 1,
        balance: 1,
      });
      subAdminDetailsCount = await admin.countDocuments({ admin_id: adminId });
      const subadmin = subAdminDetails.map(agent => agent._id);
      // const superMasterIds = await Promise.all(subadmin.map(superMasterId => getAgentCreatedByMaster(superMasterId, 3)));
      // const masterIds = await Promise.all(superMasterIds.map(superMasterId => getAgentCreatedByMaster(superMasterId, 4)));
      // const agentIds = await Promise.all(masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5)));
      // const userIds = await Promise.all(agentIds.map(agentId => getAgentCreatedByMaster(agentId, 6)));

      const allCreatedBy = [
        subadmin,
        // ...superMasterIds.flat(),
        // ...masterIds.flat(),
        // ...agentIds.flat(),
      ];

      matchConditions.$or.push({
        createdBy: { $in: allCreatedBy }
      });
    }
    if (token?.role === 2) {  // subadmin
      const adminId = token.id;
      const superMasterIds = await getAgentCreatedByMaster(adminId, 3);
      // const masterIds = await Promise.all(superMasterIds.map(superMasterId => getAgentCreatedByMaster(superMasterId, 4)));
      // const agentIds = await Promise.all(masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5)));

      const allCreatedBy = [
        mongoose.Types.ObjectId.createFromHexString(adminId),
        ...superMasterIds,
        // ...masterIds.flat(),
        // ...agentIds.flat(),
      ];

      matchConditions.$or.push({
        createdBy: { $in: allCreatedBy }
      });
    }

    if (token?.role === 3) {  // super master
      const superMasterIds = token.id
      // const masterIds = await getAgentCreatedByMaster(superMasterIds, 4);
      // const agentIds = await Promise.all(masterIds.map(masterId => getAgentCreatedByMaster(masterId, 5)));
      const allCreatedBy = [
        helper.getMongoType(superMasterIds),
        // ...masterIds,
      ];
      matchConditions.$or.push({
        createdBy: { $in: allCreatedBy }
      });
    }

    if (token?.role === 4) {  // master
      const masterIds = token.id
      // const agentIds = await getAgentCreatedByMaster(masterIds, 5);

      const allCreatedBy = [
        helper.getMongoType(masterIds),
      ];

      matchConditions.$or.push({
        createdBy: { $in: allCreatedBy }
      });
    }

    if (token?.role === 5) {  // agent
      matchConditions.$or.push({
        createdBy: createdId,
        role: 6,  // user creates "role: 6" (or similar condition)
      });
    }

    if (req?.query?.user_name && req?.query?.user_name !== 'null') {
      matchConditions.$and.push({
        user_name: { $regex: req?.query?.user_name, $options: 'i' },
      });
    }
    if (req?.query?.status && req?.query?.status !== 'null') {
      matchConditions.$and.push({
        status: Number(req?.query?.status),
      });
    }

    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }

    if (matchConditions.$and.length === 0) {
      delete matchConditions.$and;
    }
    const testModel = token.role !== 1 ? user : admin
    const userData = await testModel.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "transaction_histories",
          let: {
            parent: {
              $toString: "$_id",
            },
          },
          pipeline: [
            {
              $addFields: {
                child: "$sender_id",
              },
            },
            {
              $match: {
                $expr: {
                  $eq: ["$child", "$$parent"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalDeposits: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ["$type", 1],
                      },
                      // Deposit transactions
                      "$amount",
                      0,
                    ],
                  },
                },
                totalWithdrawals: {
                  $sum: {
                    $cond: [
                      {
                        $eq: ["$type", 2],
                      },
                      // Withdrawal transactions
                      "$amount",
                      0,
                    ],
                  },
                },
              },
            },
          ],
          as: "transactionSummary",
        },
      },
      {
        $addFields: {
          creditReference: {
            $subtract: [
              {
                $arrayElemAt: [
                  "$transactionSummary.totalDeposits",
                  0,
                ],
              },
              {
                $arrayElemAt: [
                  "$transactionSummary.totalWithdrawals",
                  0,
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "createdBy",
          as: "downlineUsers",
        },
      },
      {
        $addFields: {
          balanceInDownline: {
            $sum: [
              {
                $sum: {
                  $map: {
                    input: "$downlineUsers",
                    as: "user",
                    in: {
                      $add: ["$$user.balance", "$$user.escrowBalance"],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          referencePandL: {
            $subtract: [
              "$balanceInDownline",
              "$creditReference",
            ],
          },
        },
      },
      {
        $project: {
          user_name: 1,
          name: "$user_name",
          status: 1,
          role: 1,
          balance: 1,
          availableBalance: "$balance",
          balanceInDownline: 1,
          withdraw_by_upline: 1,
          deposite_to_downline: 1,
          creditReference: 1,
          referencePandL: 1
        },
      }, {
        $facet: {
          totalCount: [{ $count: 'total' }],
          pagedData: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    const [result] = userData
    const structuredData = subAdminDetails ? [...result.pagedData, ...subAdminDetails] : result.pagedData
    const data = helper.paginate(structuredData, page)
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { pageData: data, totalCount: subAdminDetailsCount ? result.totalCount[0]?.total + subAdminDetailsCount : result.totalCount[0]?.total }))
  } catch (error) {
    return res.status(500).send(await helper.jsonresponse(null, error.message, null))
  }
}


const getAllUser = async (req, res) => {
  try {
    const token = req.params.token
    const page = parseInt(req.query.page || 1, 10);
    const pageSize = parseInt(process.env.PAGE_SIZE || 5, 10);
    const skip = (page - 1) * pageSize;
    const matchConditions = {
      $or: [],
      $and: [],
    };
    console.log("🚀 ~ getAllUser ~ req.query:", req.query, Number(req?.query?.status))
    matchConditions.$and.push({
      createdBy: helper.getMongoType(token.id)
    })

    if (matchConditions.$or.length === 0) {
      delete matchConditions.$or;
    }

    if (matchConditions.$and.length === 0) {
      delete matchConditions.$and;
    }
    const [userData, balanceDetails] = await Promise.all([
      await user.aggregate([
        {
          $match: matchConditions
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "createdBy",
            as: "recursiveDownline",
            maxDepth: 5,
            depthField: "depth",
          },
        },
        {
          $addFields: {
            balanceDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$recursiveDownline",
                      as: "user",
                      in: {
                        $add: [
                          "$$user.balance",
                          "$$user.escrowBalance",
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "transaction_histories",
            let: {
              parent: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $addFields: {
                  child: "$sender_id",
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$child", "$$parent"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalDeposits: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 1],
                        },
                        // Deposit transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                  totalWithdrawals: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 2],
                        },
                        // Withdrawal transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "transactionSummary",
          },
        },
        {
          $addFields: {
            creditReference: {
              $subtract: [
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalDeposits",
                    0,
                  ],
                },
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalWithdrawals",
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "createdBy",
            as: "downlineUsers",
          },
        },
        {
          $addFields: {
            balanceInDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$downlineUsers",
                      as: "user",
                      in: {
                        $add: ["$$user.balance", "$$user.escrowBalance"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            referencePandL: {
              $subtract: [
                "$balanceInDownline",
                "$creditReference",
              ],
            },
          },
        },
        {
          $addFields: {
            totalBalance: {
              $add: [
                "$balanceDownline",
                "$balance",
              ],
            },
          },
        },
        {
          $match: {
            $and: [
              { user_name: req.query.user_name !== 'null' ? { $regex: req.query.user_name, $options: 'i' } : { $exists: true } },
              { status: req.query.status !== 'null' ? Number(req.query.status) : { $exists: true } }
            ]
          }
        },
        {
          $project: {
            user_name: 1,
            status: 1,
            createdBy: 1,
            createdAt: 1,
            email: 1,
            userCount: 1,
            role: 1,
            casino_block: 1,
            creditReference: { $ifNull: ["$creditReference", 0] },
            balance: { $ifNull: ["$balanceDownline", 0] },
            availableBalance: { $ifNull: ["$balance", 0] },
            exposure: { $ifNull: ["$exposure", 0] },
            referencePandL: { $ifNull: ['$referencePandL', 0] },
            totalBalance: { $ifNull: ['$totalBalance', 0] },
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
      ]),
      user.aggregate([
        {
          $match: {
            createdBy: helper.getMongoType(token.id)
          },
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "createdBy",
            as: "recursiveDownline",
            maxDepth: 5,
            depthField: "depth",
          },
        },
        {
          $addFields: {
            balanceDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$recursiveDownline",
                      as: "user",
                      in: {
                        $add: [
                          "$$user.balance",
                          "$$user.escrowBalance",
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "transaction_histories",
            let: {
              parent: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $addFields: {
                  child: "$sender_id",
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$child", "$$parent"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalDeposits: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 1],
                        },
                        // Deposit transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                  totalWithdrawals: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$type", 2],
                        },
                        // Withdrawal transactions
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "transactionSummary",
          },
        },
        {
          $addFields: {
            creditReference: {
              $subtract: [
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalDeposits",
                    0,
                  ],
                },
                {
                  $arrayElemAt: [
                    "$transactionSummary.totalWithdrawals",
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "createdBy",
            as: "downlineUsers",
          },
        },
        {
          $addFields: {
            balanceInDownline: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: "$downlineUsers",
                      as: "user",
                      in: {
                        $add: ["$$user.balance", "$$user.escrowBalance"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            referencePandL: {
              $subtract: [
                "$balanceInDownline",
                "$creditReference",
              ],
            },
          },
        },
        {
          $addFields: {
            totalBalance: {
              $add: [
                "$balanceDownline",
                "$balance",
              ],
            },
          },
        },
        {
          $project: {
            user_name: 1,
            status: 1,
            createdBy: 1,
            createdAt: 1,
            email: 1,
            userCount: 1,
            role: 1,
            userBalance: "$balance",
            casino_block: 1,
            creditReference: { $ifNull: ["$creditReference", 0] },
            balance: { $ifNull: ["$balanceDownline", 0] },
            availableBalance: { $ifNull: ["$balance", 0] },
            exposure: { $ifNull: ["$exposure", 0] },
            referencePandL: { $ifNull: ['$referencePandL', 0] },
            totalBalance: { $ifNull: ['$totalBalance', 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalCrediReference: {
              $sum: "$creditReference",
            },
            balance: {
              $sum: "$userBalance"
            },
            totalBalanceInDownline: {
              $sum: "$totalBalance"
            },
            totalReferencePandL: {
              $sum: "$referencePandL"
            }
          }
        },
        {
          $addFields: {
            totalBalance: {
              $sum: [
                '$totalCrediReference',
                '$balance'
              ]
            }
          }
        },
        {
          $project: {
            totalCrediReference: 1,
            balance: 1,
            totalBalanceInDownline: 1,
            totalReferencePandL: 1,
            totalBalance: 1,
          }
        }
      ])
    ])
    console.log("🚀 ~ getAllUser ~ userData:", JSON.stringify(userData, null, 2))


    const [result] = userData
    const [balanceResult] = balanceDetails;
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", { ...result, balanceResult, totalCount: result.totalCount[0]?.total }))
  } catch (error) {
    console.log("🚀 ~ getAllUser ~ error:", error)
    return res.status(500).send(await helper.jsonresponse(null, error.message, null))
  }
}

const getUserBalance = async (req, res) => {
  try {
    const token = req.params.token
    const userBalance = await user.findOne({ _id: token.id }, { user_name: 1, role: 1, email: 1, balance: 1, escrowBalance: 1 })
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", userBalance))
  } catch (error) {
    return res.status(500).send(await helper.jsonresponse(null, error.message, null))
  }
}

const getSportsList = async (req, res) => {
  try {
    const token = req.params.token

    const userBalance = await user.findOne({ _id: token.id }, { sportsList: 1 })
    return res.status(200).send(await helper.jsonresponse(true, "commonmessage.success", userBalance))
  } catch (error) {
    return res.status(500).send(await helper.jsonresponse(null, error.message, null))
  }
}


const updateSportsList = async (req, res) => {
  try {

    const token = req.params.token
    const sportsList = req.body.sportsList
    let userData, uplineUser, result
    if (token.role <= 2) {
      uplineUser = await admin.aggregate([
        {
          $match: { _id: token }  // Start with the employee with _id 1 (Alice)
        },
        {
          $graphLookup: {
            from: "admins",            // Search the "employees" collection
            startWith: "$admin_id",            // Start with the employee's _id
            connectFromField: "admin_id",      // Current employee's _id
            connectToField: "_id",  // Matching managerId field in employees
            as: "recursiveUpline",         // Store the result in the "reportingChain" field
            maxDepth: 3,                  // Limit the depth of the traversal to 3 levels
            depthField: "level"           // Add a field "level" to indicate the depth of each employee
          }
        }
      ])
    } else {
      uplineUser = await user.aggregate([
        {
          $match: { _id: helper.getMongoType(token.id) }
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$createdBy", // Start from the current user's createdBy field
            connectFromField: "createdBy",
            connectToField: "_id",
            as: "recursiveUpline",
            maxDepth: 7, // Limit recursion depth
            depthField: "depth"
          }
        }
      ]);
      userData = await user.aggregate([
        {
          $match: { _id: helper.getMongoType(token.id) }
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "createdBy",
            as: "recursiveDownline",
            maxDepth: 5,
            depthField: "depth",
          },
        },])
    }
    if (uplineUser) {
      uplineUser.forEach((usr) => {
        usr?.recursiveUpline.forEach(async (upline) => {
          result = upline.sportsList.reduce((accumulator, currentItem) => {
            let correspondingItem = sportsList.find(item => item.game === currentItem.game);
            if (correspondingItem && !currentItem.status && correspondingItem.status) {
              return true;
            }
            return accumulator;
          }, false);
        })
      })
    }
    if (result) {
      return res.status(200).send(await helper.jsonresponse(false, 'updated by upline', null))
    }
    await userData?.forEach(async (usr) => {
      // Assuming you want to update users based on your recursiveUpline logic
      await usr?.recursiveDownline.forEach(async (upline) => {
        const model = token.role <= 2 ? admin : user
        const result = await model.findOneAndUpdate({ _id: upline._id }, { sportsList }, { new: true })
      })
    })
    const model = token.role <= 2 ? admin : user
    const updatedData = await model.findOneAndUpdate({ _id: token.id }, { sportsList }, { new: true })
    res.status(200).send(await helper.jsonresponse(true, 'commonmessage.success', updatedData))
  }
  catch (error) {
    res.status(500).send(await helper.jsonresponse(false, error.message, null))
  }
}

export {
  getAllUsers,
  updateUserStatus,
  getSuspendAndBlockLists,
  blockUser,
  getSubUser,
  getDashboardData,
  transferMoney,
  getUnreadMessage,
  updateUnreadMessage,
  getChatHistory,
  getBalanceDetails,
  getAllUser,
  getUserBalance,
  updateSportsList,
  getSportsList
}
