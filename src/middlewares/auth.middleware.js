import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { User } from "../models/e-commerce/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, _ , next) => {
  try 
  {
        // get token from cookies or authorization header
        const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

        // check if token is present
        if (!token) {
        throw new ApiError(401, "Unauthorized: No token provided");
        }

        // verify token 
        const decodedToekn = jwt.verify(token, process.env.JWT_SECRET_KEY); 

        // find user by id from decoded token and select all fields except password and refresh token
        const user = await User.findById(decodedToekn?._id).select(
        " -password -refreshToken"
        );

        if (!user) {
        throw new ApiError(401, "INVALID ACCESS TOKEN");
        }

        // attach user to request object
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized: Invalid token");
    }
});
