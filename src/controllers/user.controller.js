// import {asyncHandler} from 'express-async-handler.js';
import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/e-commerce/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



// generate access token and refresh token

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // return access token and refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

// register user

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, username, email, password } = req.body;
  console.log("email :", email);

  //  validate user details - not empty
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists in database - username and email
  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    throw new ApiError(400, "User already exists with this username or email");
  }

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path; // avatar
  const imagesLocalPaths = req.files?.coverimage[0]?.path; // images

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  if (!imagesLocalPaths) {
    throw new ApiError(400, "Cover image is required");
  }

  // upload them to cloudinary url , avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(imagesLocalPaths);

  if (!avatar || !coverImage) {
    throw new ApiError(500, "Error uploading images to cloudinary");
  }

  // create user object and save to database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // remove pass and refrsh token from response

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }

  //  return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// Login User

const loginUser = asyncHandler(async (req, res) => {
  // req.body -> email , password
  const { email, username, password } = req.body;

  // validate email, username and password - not empty
  if (!username && !email) {
    throw new ApiError(400, "Email or username is required");
  }

  // find user in database by email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found with this email or username");
  }

  // password check
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  // generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // send cookies and response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send access token and refresh token in http only cookies with secure and same site options
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // return response with cookies
  return res
    .status(200)
    .cookie("acessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// LOG OUT USER

const logoutUser = asyncHandler(async (req, res) => {
  // clear access token and refresh token from cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  // clear cookies with secure and same site options

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(0), // expire the cookie immediately
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

// refresh access token

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookies or request body
  const incommingRefreshToken = req.body.refreshToken;

  // validate refresh token
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorised Request");
  }

  try {
    // verify refresh token
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // find user by id from decoded token and check if refresh token matches
    const user = await User.findById(decodedToken?._id);

    // if user not found or refresh token does not match throw error
    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }

    // check if refresh token matches the one in database

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token - token mismatch");
    }

    // generate new access token
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // generate new access token and refresh token
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // return new access token and refresh token in cookies and response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "error?.message || Invalid refresh token");
  }
});

// change current user password

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  // get current user id from req.user
  const { oldPassword, newPassword } = req.body;

  // validate old password and new password - not empty
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  // find user by id from req.user and check if old password is correct
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  // if old password is not correct throw error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

// get current user details

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// update account details of current user

const updateAccountDetails = asyncHandler(async (req, res) => {
  // get current user id from req.user
  const { fullName, username, email } = req.body;

  // validate full name, username and email - not empty

  if (!fullName || !username || !email) {
    throw new ApiError(400, "Full name, username and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        username,
        email,
      },
    },
    { new: true, runValidators: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// file update

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLcalPath = req.file?.path;

  if (!avatarLcalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLcalPath, "avatars");

  if (!avatar.url) {
    throw new ApiError(500, "Error uploading avatar to cloudinary");
  }

  // update user avatar in database and return updated user details in response
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));

});

// update user cover image

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath, "cover-images");

  if (!coverImage.url) {
    throw new ApiError(500, "Error uploading cover image to cloudinary");
  }

  // update user cover image in database and return updated user details in response
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));



});



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage
};

// let coverimagelocalpath;
// if(req,files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
//   coverimagelocalpath = req.files.coverimage[0].path;
// }
/* This code checks if the `req.files` object exists and if it contains a `coverimage` property that is an array with at least one element. If these conditions are met, it assigns the local file path of the first cover image to the variable `coverimagelocalpath`. This is typically used in scenarios where multiple files can be uploaded, and we want to ensure that we are accessing the correct file path for further processing, such as uploading to a cloud storage service. */
