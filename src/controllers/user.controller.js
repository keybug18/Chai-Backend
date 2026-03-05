// import {asyncHandler} from 'express-async-handler.js';
import asyncHandler from "express-async-handler";



const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message : "User registered successfully"
  })  
})

export {
  registerUser
}                                               