// import { constrainedMemory } from "process";
import Message from "../models/message.js";
import User from "../models/user.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    ); //$ne = notEqualto

    // count number of unseen messages
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ succes: false, message: error.message });
  }
};

//get all the message for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    //when we select any user the messages will be seen
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// api to mark messages as seen using message id
export const markMessageAsSeen = async (req,res)=>{
    try{
     const {id} = req.params; //we get the id through params
     await Message.findByIdAndUpdate(id, {seen: true})
     res.json({success: true})
    }catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
 
// send message to selected user

export const sendMessage = async(req,res)=>{
    try{
       
     const {text, image} = req.body;
     const receiverId = req.params.id;
     const senderId = req.user._id; //get this through middleware
    
     //if we have image then , have to store in cloudinary
     let imageurl;
     if(image){
        const uploadResponse = await cloudinary.uploader.upload(image)
        imageurl = uploadResponse.secure_url;
     }
    //to store the in database
    const newMessage = await Message.create({
        senderId,
        receiverId,
        text,
        image: imageurl
    })

    //Emit the new message to the receiver's socket (reeiver will instantly see the message using socket.io)
    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage", newMessage)
    }
  
    res.json({success: true, newMessage}); //after this we have to show text in real time so we use socket.io >setup in  server.js

    }catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
