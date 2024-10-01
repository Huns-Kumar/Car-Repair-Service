import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';

import jwt from 'jsonwebtoken';

import { User } from '../models/user.model.js'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, username, password, phone, role } = req.body
    console.log("req.body in user.controller.js: ", req.body)

    if (
        [name, email, username, password, phone, role].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //    const existedUser = User.findOne({email});
    //    const existedUser = User.findOne({username});

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "username or email is already exist");
    }

    let imageLocalPath;

    if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
        imageLocalPath = req.files.image[0].path;
    }
    console.log("req.files in user.controller.js: ", req.files)

    // if (!imageLocalPath) {
    //     throw new ApiError(400, "Image file is required");
    // }

    let image;
    if (imageLocalPath) {
        image = await uploadOnCloudinary(imageLocalPath);
    }

    // if (!image) {
    //     throw new ApiError(400, "Image file is required")
    // }

    const user = await User.create({
        name,
        email,
        username: username.toLowerCase(),
        password,
        phone,
        role,
        image: image?.url || "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    console.log('createdUser in user.controller.js', createdUser)

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a User");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body

    if (
        [email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User LoggedIn Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        },
    },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logout Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { newRefreshToken, newAccessToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { refreshToken: newRefreshToken, accessToken: newAccessToken },
                    "Access Token refreshed Succesfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }


})

const getCurrentUserProfile = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current User fetched successfully"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    console.log("old and new password in changeCurrentPassword: ", oldPassword, newPassword)

    if (
        [oldPassword, newPassword].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Current and new password is required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "Unauthorized Request")
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const { name, email, username, phone } = req.body;

    if (name !== undefined && name !== '') {
        user.name = name;
    }

    if (email !== undefined && email !== '') {
        user.email = email;
    }

    if (username !== undefined && username !== '') {
        user.username = username;
    }

    if (phone !== undefined && phone !== '') {
        user.phone = phone;
    }

    const updatedUser = await user.save();

    return res.status(201).json(
        new ApiResponse(200, { user: updatedUser }, "User details Updated Successfully")
    )

});

const updateUserProfilePicture = asyncHandler(async (req, res) => {
    const imageLocalPath = req.file?.path
    const oldImage = req.user?.image

    if (!imageLocalPath) {
        throw new ApiError(400, "image file is required")
    }

    const image = await uploadOnCloudinary(imageLocalPath)

    if (!image.url) {
        throw new ApiError(400, "Error while uploading image at cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            image: image.url
        }
    }, { new: true }).select("-password -refreshToken")

    if (oldImage) {
        await deleteFromCloudinary(oldImage)
    }
    return res.status(200).json(new ApiResponse(200, user, "Image Updated Successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUserProfile,
    changeCurrentPassword,
    updateUserProfile,
    updateUserProfilePicture,
} 