 // import {asyncHandler} from 'express-async-handler.js';
import asyncHandler from "express-async-handler";
import {ApiError} from "../utils/apiError.js";
import User from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";



const registerUser = asyncHandler(async (req, res) => {
  
    // get user details from frontend
    const {fullName , username , email , password} = req.body;
    console.log("email :" , email);


    //  validate user details - not empty
    if(
      [fullName , username , email , password].some((field) => field?.trim() === "")
    ){
      throw new ApiError(400 , "All fields are required");
    }


    // check if user already exists in database - username and email
     const userExists = await User.findOne({
      $or : [
        {username},
        {email}
      ]
     })

    if(userExists){
      throw new ApiError(400 , "User already exists with this username or email");
    }


    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path; // avatar
    const imagesLocalPaths = req.files?.coverimage[0]?.path; // images

    if(!avatarLocalPath){
      throw new ApiError(400 , "Avatar is required");
    }

    if(!imagesLocalPaths){
      throw new ApiError(400 , "Cover image is required");
    }


    // upload them to cloudinary url , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(imagesLocalPaths);

    if(!avatar || !coverImage){
      throw new ApiError(500 , "Error uploading images to cloudinary");
    }    


    // create user object and save to database
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
      email,
      password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    
    // remove pass and refrsh token from response
    
    
    
    
    // check for user creation
    if(!createdUser){
      throw new ApiError(500 , "Error creating user");
    }


    //  return response
    return res.status(201).json(
      new ApiResponse(
        201 ,
        createdUser , 
        "User registered successfully"
      )
    )
     
})

export {
  registerUser
}                                                         