import { Router } from 'express';

import {
    refreshAccessToken, 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUserProfile, 
    changeCurrentPassword, 
    updateUserProfile,
    updateUserProfilePicture,
}
    from '../controllers/user.controller.js';

import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.route('/refresh-token').post(refreshAccessToken)
router.route('/register').post(verifyJWT, upload.single('image'), registerUser )
router.route('/login').post(verifyJWT, loginUser)
router.route('/logout').get(verifyJWT, logoutUser)
router.route('/user/userprofile').get(verifyJWT, getCurrentUserProfile)
router.route('/user/changecurrentpassword').post(verifyJWT, changeCurrentPassword)
router.route('/user/updateprofile').post(verifyJWT, updateUserProfile)
router.route('/user/updateprofilepicture').post(verifyJWT, upload.single('image'), updateUserProfilePicture )
