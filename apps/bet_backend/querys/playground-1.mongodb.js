// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
/* eslint-disable no-undef */
// Install Mongodb Extenstion and conncet with the database
// all the reference query that was used in the project
// The current database to use.
use("BET");

// getAllUsers Query
// db.users.aggregate([
//     {
//         // Step 1: Start with the SuperAdmin ID (or any user)
//         $match: {
//             _id: ObjectId("676ab82bf8e9bf53efdaa34b")
//         }
//     },
//     {
//         // Step 2: Use $graphLookup to find users created by the SuperAdmin and their downline
//         $graphLookup: {
//             from: "users",          // The same collection to look within (users)
//             startWith: "$_id",      // Start the lookup from the SuperAdmin's _id
//             connectFromField: "_id", // Use the current user's _id
//             connectToField: "createdBy", // Match against the 'createdBy' field in other users
//             as: "downlineUsers",     // Store the result in a field named 'downlineUsers'
//             maxDepth: 10,           // Optional: Limit the depth of recursion
//             depthField: "depth"     // Optional: Track how deep the recursion goes (useful for debugging)
//         }
//     },
//     {
//         // Step 3: Optionally unwind the 'downlineUsers' to get individual users in a flat array
//         $unwind: {
//             path: "$downlineUsers",  // Flatten the downlineUsers array
//             preserveNullAndEmptyArrays: true // Preserve users with no downline (if needed)
//         }
//     },
//     {
//         $match: {
//             $and: [
//                 {
//                     user_name: {
//                         $regex: "agent1",
//                         $options: "i"
//                     }
//                 }
//             ]
//         }
//     },
//     {
//         $sort: {
//             "downlineUsers.role": 1,  // First by role ascending
//             "downlineUsers.user_name": 1  // Then by user_name ascending
//         }
//     },
//     {
//         // Step 4: Project the relevant fields (optional)
//         $project: {
//             downlineUsers: 1,  // Include the downline users found
//         }
//     }
// ]);


// credi reference and Balance in Downline
// db.users.aggregate([
//     {
//         $match: {
//             _id: ObjectId("676ab82bf8e9bf53efdaa34b"),
//         },
//     },
//     {
//         $lookup: {
//             from: "transaction_histories",
//             let: {
//                 parent: {
//                     $toString: "$_id",
//                 },
//             },
//             pipeline: [
//                 {
//                     $addFields: {
//                         child: "$sender_id",
//                     },
//                 },
//                 {
//                     $match: {
//                         $expr: {
//                             $eq: ["$child", "$$parent"],
//                         },
//                     },
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalDeposits: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $eq: ["$type", 1],
//                                     },
//                                     // Deposit transactions
//                                     "$deposite_by_upline",
//                                     0,
//                                 ],
//                             },
//                         },
//                         totalWithdrawals: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $eq: ["$type", 2],
//                                     },
//                                     // Withdrawal transactions
//                                     "$withdraw_from_downline",
//                                     0,
//                                 ],
//                             },
//                         },
//                     },
//                 },
//             ],
//             as: "transactionSummary",
//         },
//     },
//     {
//         $addFields: {
//             creditReference: {
//                 $subtract: [
//                     {
//                         $arrayElemAt: [
//                             "$transactionSummary.totalDeposits",
//                             0,
//                         ],
//                     },
//                     {
//                         $arrayElemAt: [
//                             "$transactionSummary.totalWithdrawals",
//                             0,
//                         ],
//                     },
//                 ],
//             },
//         },
//     },
//     {
//         $lookup: {
//             from: "users",
//             localField: "_id",
//             foreignField: "createdBy",
//             as: "downlineUsers",
//         },
//     },
//     {
//         $addFields: {
//             balanceInDownline: {
//                 $sum: [
//                     {
//                         $sum: {
//                             $map: {
//                                 input: "$downlineUsers",
//                                 as: "user",
//                                 in: {
//                                     $add: ["$$user.balance", "$$user.escrowBalance"],
//                                 },
//                             },
//                         },
//                     },
//                 ],
//             },
//         },
//     },
//     {
//         $addFields: {
//             referencePandL: {
//                 $subtract: [
//                     "$balanceInDownline",
//                     "$creditReference",
//                 ],
//             },
//         },
//     },
//     {
//         $project: {
//             user_name: 1,
//             status: 1,
//             role: 1,
//             availableBalance: "$balance",
//             creditReference: 1,
//             balanceInDownline: 1,
//             withdraw_by_upline: 1,
//             deposite_to_downline: 1,
//             referencePandL: 1
//         },
//     },
// ])


// db.users.aggregate([
//     {
//         $match: {
//             _id: ObjectId("676ab82bf8e9bf53efdaa34b"),
//         },
//     },
//     {
//         $lookup: {
//             from: "transaction_histories",
//             let: {
//                 parent: {
//                     $toString: "$_id",
//                 },
//             },
//             pipeline: [
//                 {
//                     $addFields: {
//                         child: "$sender_id",
//                     },
//                 },
//                 {
//                     $match: {
//                         $expr: {
//                             $eq: ["$child", "$$parent"],
//                         },
//                     },
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalDeposits: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $eq: ["$type", 1],
//                                     },
//                                     // Deposit transactions
//                                     "$deposite_by_upline",
//                                     0,
//                                 ],
//                             },
//                         },
//                         totalWithdrawals: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $eq: ["$type", 2],
//                                     },
//                                     // Withdrawal transactions
//                                     "$withdraw_from_downline",
//                                     0,
//                                 ],
//                             },
//                         },
//                     },
//                 },
//             ],
//             as: "transactionSummary",
//         },
//     },
//     {
//         $addFields: {
//             creditReference: {
//                 $subtract: [
//                     {
//                         $arrayElemAt: [
//                             "$transactionSummary.totalDeposits",
//                             0,
//                         ],
//                     },
//                     {
//                         $arrayElemAt: [
//                             "$transactionSummary.totalWithdrawals",
//                             0,
//                         ],
//                     },
//                 ],
//             },
//         },
//     },
//     {
//         $lookup: {
//             from: "users",
//             localField: "_id",
//             foreignField: "createdBy",
//             as: "downlineUsers",
//         },
//     },
//     {
//         $addFields: {
//             balanceInDownline: {
//                 $sum: [
//                     {
//                         $sum: {
//                             $map: {
//                                 input: "$downlineUsers",
//                                 as: "user",
//                                 in: {
//                                     $add: ["$$user.balance", "$$user.escrowBalance"],
//                                 },
//                             },
//                         },
//                     },
//                 ],
//             },
//         },
//     },
//     {
//         $addFields: {
//             referencePandL: {
//                 $subtract: [
//                     "$balanceInDownline",
//                     "$creditReference",
//                 ],
//             },
//         },
//     },
//     {
//         $project: {
//             user_name: 1,
//             status: 1,
//             role: 1,
//             availableBalance: "$balance",
//             creditReference: 1,
//             balanceInDownline: 1,
//             withdraw_by_upline: 1,
//             deposite_to_downline: 1,
//             referencePandL: 1
//         },
//     },
// ])


// db.histories.aggregate([
//     {
//         $match: {
//             $or: [{
//                 sender_id: '676ab8fc7eeebe9ed627f5d7',
//                 receiver_id: '676ab8fc7eeebe9ed627f5d7'
//             }]
//         }
//     },
//     {
//         // Step 1: Add dynamic fields for each transaction type
//         $addFields: {
//             deposite_to_downline: {
//                 $cond: {
//                     if: {
//                         $and: [
//                             { $eq: ["$type", 1] },
//                             { $gt: ["$sender_role", userData ? userData.role : token.role] }
//                         ]
//                     },
//                     then: "$amount",
//                     else: {
//                         $cond: {
//                             if: {
//                                 $and: [
//                                     { $eq: ["$type", 1] },
//                                     { $gt: ["$receiver_role", userData ? userData.role : token.role] }
//                                 ]
//                             },
//                             then: "$amount",
//                             else: 0
//                         }
//                     }
//                 }
//             },
//             deposite_by_upline: {
//                 $cond: {
//                     if: {
//                         $and: [
//                             { $eq: ["$type", 1] },
//                             { $lt: ["$sender_role", userData ? userData.role : token.role] }
//                         ]
//                     },
//                     then: "$amount",
//                     else: {
//                         $cond: {
//                             if: {
//                                 $and: [
//                                     { $eq: ["$type", 1] },
//                                     { $lt: ["$receiver_role", userData ? userData.role : token.role] }
//                                 ]
//                             },
//                             then: "$amount",
//                             else: 0
//                         }
//                     }
//                 }
//             },
//             withdraw_from_downline: {
//                 $cond: {
//                     if: {
//                         $and: [
//                             { $eq: ["$type", 2] },
//                             { $gt: ["$sender_role", userData ? userData.role : token.role] }
//                         ]
//                     },
//                     then: "$amount",
//                     else: {
//                         $cond: {
//                             if: {
//                                 $and: [
//                                     { $eq: ["$type", 2] },
//                                     { $gt: ["$receiver_role", userData ? userData.role : token.role] }
//                                 ]
//                             },
//                             then: "$amount",
//                             else: 0
//                         }
//                     }
//                 }
//             },
//             withdraw_by_upline: {
//                 $cond: {
//                     if: {
//                         $and: [
//                             { $eq: ["$type", 2] },
//                             { $lt: ["$sender_role", userData ? userData.role : token.role] }
//                         ]
//                     },
//                     then: "$amount",
//                     else: {
//                         $cond: {
//                             if: {
//                                 $and: [
//                                     { $eq: ["$type", 2] },
//                                     { $lt: ["$receiver_role", userData ? userData.role : token.role] }
//                                 ]
//                             },
//                             then: "$amount",
//                             else: 0
//                         }
//                     }
//                 }
//             }
//         }
//     },
//     {
//         // Step 3: Optionally, you can project only the needed fields
//         $project: {
//             sender_id: 1,
//             sender_name: 1,
//             sender_role: 1,
//             receiver_role: 1,
//             amount: 1,
//             receiver_id: 1,
//             receiver_name: 1,
//             type: 1,
//             remaining_balance: 1,
//             from_to: 1,
//             remarks: 1,
//             transaction_type: 1, // Show the new dynamically added field
//             createdAt: 1,
//             updatedAt: 1,
//             deposite_to_downline: 1, // Include the deposite_to_downline field
//             deposite_by_upline: 1,   // Include the deposite_by_upline field
//             withdraw_from_downline: 1, // Include the withdraw_from_downline field
//             withdraw_by_upline: 1    // Include the withdraw_by_upline field
//         }
//     }
// ]);



// db.users.aggregate([
//     {
//         $match: {
//             _id: ObjectId("676ab82bf8e9bf53efdaa34b"),
//         },
//     },
//     {
//         $lookup: {
//             from: "transaction_histories",
//             let: {
//                 parent: {
//                     $toString: "$_id",
//                 },
//             },
//             pipeline: [
//                 {
//                     $addFields: {
//                         child: "$sender_id",
//                     },
//                 },
//                 {
//                     $match: {
//                         $expr: {
//                             $eq: ["$child", "$$parent"],
//                         },
//                     },
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalDeposits: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $eq: ["$type", 1],
//                                     },
//                                     // Deposit transactions
//                                     "$deposite_by_upline",
//                                     0,
//                                 ],
//                             },
//                         },
//                         totalWithdrawals: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $eq: ["$type", 2],
//                                     },
//                                     // Withdrawal transactions
//                                     "$withdraw_from_downline",
//                                     0,
//                                 ],
//                             },
//                         },
//                     },
//                 },
//             ],
//             as: "transactionSummary",
//         },
//     },
//     {
//         $addFields: {
//             creditReference: {
//                 $subtract: [
//                     {
//                         $arrayElemAt: [
//                             "$transactionSummary.totalDeposits",
//                             0,
//                         ],
//                     },
//                     {
//                         $arrayElemAt: [
//                             "$transactionSummary.totalWithdrawals",
//                             0,
//                         ],
//                     },
//                 ],
//             },
//         },
//     },
//     {
//         $lookup: {
//             from: "users",
//             localField: "_id",
//             foreignField: "createdBy",
//             as: "downlineUsers",
//         },
//     },
//     // Graph lookup to recursively calculate downline balances
//     {
//         $graphLookup: {
//             from: "users",
//             startWith: "$_id", // Start with the current user's ID
//             connectFromField: "_id", // Find users created by the current user
//             connectToField: "createdBy", // Look for users whose `createdBy` field matches the current user's `_id`
//             as: "recursiveDownline", // Store the resulting users in this array
//             maxDepth: 5, // Set a max depth based on your roles, can be adjusted
//             depthField: "depth", // Optional field to store the depth of each user in the hierarchy
//         },
//     },
//     {
//         $addFields: {
//             balanceInDownline: {
//                 $sum: [
//                     {
//                         $sum: {
//                             $map: {
//                                 input: "$recursiveDownline",
//                                 as: "user",
//                                 in: {
//                                     $add: ["$$user.balance", "$$user.escrowBalance"],
//                                 },
//                             },
//                         },
//                     },
//                 ],
//             },
//         },
//     },
//     {
//         $addFields: {
//             referencePandL: {
//                 $subtract: [
//                     "$balanceInDownline",
//                     "$creditReference",
//                 ],
//             },
//         },
//     },
//     {
//         $project: {
//             user_name: 1,
//             status: 1,
//             role: 1,
//             availableBalance: "$balance",
//             creditReference: 1,
//             balanceInDownline: 1,
//             withdraw_by_upline: 1,
//             deposite_to_downline: 1,
//             referencePandL: 1,
//             recursiveDownline: "$recursiveDownline"
//         },
//     },
// ])

// db.users.aggregate([
//   {
//     $match: {
//       // Match the current user by their _id
//       _id: ObjectId("676aba047eeebe9ed627f68f") // Replace with the user's _id
//     }
//   },
//   {
//     $graphLookup: {
//       from: "users", // The collection to search in
//       startWith: "$createdBy", // Start from the `createdBy` field (the current user's upline)
//       connectFromField: "createdBy", // Recursively connect from the `createdBy` field
//       connectToField: "_id", // Connect to the `_id` field in the users collection
//       as: "recursiveUpline", // Store the results in the `recursiveUpline` field
//       maxDepth: 7, // Limit depth of recursion (adjust as needed)
//       depthField: "depth" // Add the `depth` field to track the depth of each upline
//     }
//   },
//   {
//     $unwind: { path: "$recursiveUpline", preserveNullAndEmptyArrays: true }
//   },
//   {
//     $project: {
//       id: "$recursiveUpline._id",
//       sportsList: "$recursiveUpline.sportsList"
//     }
//   },
// ]);

/*
    let userData = user.aggregate([
      {
        $match: { _id: helper.getMongoType("676ab82bf8e9bf53efdaa34b") }
      },
      {
        $graphLookup: {
          from: "users", // The collection to search in
          startWith: "$createdBy", // Start from the `createdBy` field (the current user's upline)
          connectFromField: "createdBy", // Recursively connect from the `createdBy` field
          connectToField: "_id", // Connect to the `_id` field in the users collection
          as: "recursiveUpline", // Store the results in the `recursiveUpline` field
          maxDepth: 7, // Limit depth of recursion (adjust as needed)
          depthField: "depth" // Add the `depth` field to track the depth of each upline
        }
      },
      {
        $unwind: { path: "$recursiveUpline", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          id: "$recursiveUpline._id",
          sportsList: "$recursiveUpline.sportsList"
        }
      },
      {
        $group: {
          _id: "$id",
          sports: {
            $push: "$sportsList"
          }
        }
      }
    ]);

    console.log("🚀 ~ updateSportsList ~ userData:", userData)
    const result = checkGameStatus(userData);
    console.log(result);
    if (result) {
      res.send(await helper.jsonresponse(false, 'commonmessage.smt', null))
    }
*/


db.users.aggregate([
  {
    $match: {
      createdBy: ObjectId("676ab82bf8e9bf53efdaa34b"),
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
    $match: {
      user_name: { $regex: 'agent1', $options: 'i' },
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
    }
  }
]);
