import jwt from "jsonwebtoken";
import User from "../models/user.js";

//middleware are the function which gets executed before the controllers function

//Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    
    //get the token from frontend
    const token = req.headers.token;
    
    //check token
    if (!token) {
  return res.status(401).json({
    success: false,
    message: "Access denied. No token provided."
  });
}
    //decode the token to geet userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //we get the decoded token through which we can find userID


    const user = await User.findById(decoded.userId).select("-password"); //from the userdata we have to remove the password

    if (!user) return res.json({ success: false, message: "user not Found" }); //if user not found

    req.user = user; //so if user is available then it adds, it to the request and can be accessed in controller function
    next();
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message });
  }
};

// So we have created our middleware to protect our routes
/* flow to understand 

Frontend request
   ↓
protect middleware
   → verifies token
   → sets req.user
   ↓
checkAuth controller
   → sends user backs
*/