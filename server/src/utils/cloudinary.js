import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// u-------------------------------u
// import dotenv from "dotenv"
// dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })

        // file has been uploaded successfully
        // console.log('file is uploaded on cloudinary', response)
        // console.log("Response", response)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally save file as the upload operation got failed
        return null
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) {
            throw new Error("No public ID provided")
        }
        // delete the file from cloudinary
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        if (result.result !== "ok") {
            throw new Error("Failed to Delete File")
        }
        return {
            success: true,
            message: "File Deleted Succesfully"
        }
    } catch (error) {
        return {
            success: false,
            message: error.message || "An error occurred while deleting the file",
        }
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }