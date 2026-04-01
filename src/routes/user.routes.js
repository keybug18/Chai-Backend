import {Router} from 'express';
import {loginUser, registerUser} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
// import asyncHandler from 'express-async-handler';
import {verifyJWT} from '../middlewares/auth.middleware.js';
import {logoutUser , refreshAccessToken} from '../controllers/user.controller.js';

const router  = Router(); 

// register route
router.route("/register").post( upload.fields([
    {
        name : "avatar",
        maxCount : 1
    },
    {
        name : "images",
        maxCount : 2 
    }
])  ,registerUser);


// login route
router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT , logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;