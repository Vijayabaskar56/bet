import { admin, supportchat } from "../model/adminModel.js";
import { user } from "../model/userModel.js";
import { checking } from "../commonClass/mostCommonClass.js";

// Helper function to determine the room and chat type based on role
// room name should
const getRoomAndChat = (role, receiverId, userData, adminData, token) => {
  switch (role) {
    case 1: // Admin
      return { room: token.id, chat: "adminInChat" };
    case 2: // Sub-admin
      return receiverId ? { room: token.id, chat: "sub_adminInChat" } : { room: adminData.admin_id, chat: "sub_adminInChat" };
    case 3: // super Master
      return receiverId ? { room: token.id, chat: "supermasterInChat" } : { room: userData.createdBy.toString(), chat: "supermasterInChat" };
    case 4: // master
      return receiverId ? { room: token.id, chat: "masterInChat" } : { room: userData.createdBy.toString(), chat: "masterInChat" };
    case 5: // agent
      return receiverId ? { room: token.id, chat: "agentInChat" } : { room: userData.createdBy.toString(), chat: "agentInChat" };
    case 6: // user
      return receiverId ? { room: token.id, chat: "userInChat" } : { room: userData.createdBy.toString(), chat: "userInChat" };
    default:
      return null;
  }
};

const connectToChat = async (socket, io, request) => {
  // Ensure the token is present in the request
  if (!request._token) {
    return io.to(socket.id).emit(
      "connectChat",
      JSON.stringify({
        result: false,
        message: "Token is Not Found",
        request: request,
      })
    );
  }

  // Validate the token
  const token = await checking.validToken(
    "check",
    JSON.stringify(request._token),
    null
  );
  if (!token) {
    return io.to(socket.id).emit(
      "connectChat",
      JSON.stringify({
        result: false,
        message: "Token is Expired",
        request: request,
      })
    );
  }

  let room;
  let msg;
  const userData = await user.findOne({ _id: token.id });
  const adminData = await admin.findOne({ _id: token.id });

  // Get the room and chat type based on token role and receiver_id
  const roomAndChat = getRoomAndChat(
    token.role,
    request.receiver_id ?? request.receiverId,
    userData,
    adminData,
    token
  );
  if (!roomAndChat) {
    return io.to(socket.id).emit(
      "connectChat",
      JSON.stringify({
        result: false,
        message: "Some Issue, Try Again Later",
        request: request,
      })
    );
  }

  // Set the room and chat type
  room = roomAndChat.room;
  // Handle joining or leaving the room
  if (request.status) {
    msg = "Joined The Room";
    socket.join(room);
    // previousHistory =  await supportchat.findO
  } else {
    socket.leave(room);
    room = socket.id; // Reassign room when leaving
    msg = "Exited the Room";
  }

  // Send the response back to the room
  const resp = {
    status: true,
    id: token.id,
  };

  io.to(room).emit(
    "connectChat",
    JSON.stringify({
      result: resp,
      message: msg,
      request: request,
    })
  );
};

const sendMsg = async (socket, io, request) => {
  if (!request._token) {
    return io.to(socket.id).emit("sendMsg", JSON.stringify({ result: false, message: "Token is Not Founded", request: request }), request)
  }
  const token = await checking.validToken('check', JSON.stringify(request._token), null)
  if (!token) {
    return io.to(socket.id).emit("sendMsg", JSON.stringify({ result: false, message: "Token is Expired", request: request }), request)
  }
  // let admindata
  let sender_data = await user.findOne({ _id: token.id })
  let adminsd = await admin.findOne({ _id: token.id })
  let receiverUser = await user.find({ _id: request.receiverId })
  let receiverAdmin = await admin.find({ _id: request.receiverId })
  let creatorOfSender, creatorOfAdmin, creatorOfReceiverUser, creatorOfReceiverAdmin
  if (sender_data) {
    creatorOfSender = await user.findOne({ _id: sender_data.createdBy })
  } else if (adminsd) {
    creatorOfAdmin = await admin.find({ _id: adminsd.admin_id })
  } else if (receiverAdmin) {
    creatorOfReceiverAdmin = await admin.find({ _id: receiverAdmin.admin_id })
  } else if (receiverUser) {
    creatorOfReceiverUser = await user.findOne({ _id: receiverUser.createdBy })
  }
  const roomAndChat = getRoomAndChat(
    token.role,
    request.receiverId,
    sender_data,
    adminsd,
    token
  );
  let newMessageTime = new Date().toUTCString()
  let createMsg = {
    sender_id: request.receiverId ? request.receiverId : token.id,
    sender_name: request.receiverId ? receiverUser?.user_name ?? receiverAdmin?.name : sender_data?.user_name ?? adminsd.name,
    sender_role: sender_data?.role || adminsd.role,
    receiver_name: request.receiverId ? creatorOfReceiverUser?.user_name ?? creatorOfReceiverAdmin?.name : creatorOfSender.user_name ?? creatorOfAdmin.name,
    receiver_id: request.receiverId ? token.id : sender_data?.createdBy ?? adminsd?.admin_id,
    chats: [{
      sender_id: token.id,
      receiver_id: request.receiverId ? request.receiverId : sender_data?.createdBy ?? adminsd?.admin_id,
      message: request.message,
      image: request.image || '',
      type: request.receiverId ? 2 : 1,
      time: `${newMessageTime}`,
      msgFrom: token.id
    }]
  }

  const update = await supportchat.findOneAndUpdate({ $and: [{ sender_id: createMsg.sender_id }, { receiver_id: createMsg.receiver_id }] }, { $push: { "chats": createMsg.chats } }, { new: true })
  if (!update) {
    await supportchat.create(createMsg)
  }
  // if (update) {
  const senderId = request.receiverId ? request.receiverId : token.id
  const type = token.id === senderId ? 2 : 1
  const resp = {
    sender_id: createMsg.sender_id,
    sender_name: sender_data?.user_name || adminsd.name,
    message: request.message,
    image: request.image || '',
    type: type,
    msgFrom: token.id,
    time: `${newMessageTime}`,
  }
  io.to(roomAndChat.room).emit("sendMsg", JSON.stringify({ result: resp, message: "Msg Send Successfully", request: request }), request)
}

export { connectToChat, sendMsg };
