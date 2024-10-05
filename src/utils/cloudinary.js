import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
const deleteImagefromCloudinary = async (publicId) => {
    try {
      if (!publicId) {
        throw new ApiError(400, "Public ID is required to delete an image");
      }
  
      // Attempt to delete the image on Cloudinary using the public_id
      const result = await cloudinary.uploader.destroy(publicId);
  
      if (result.result !== 'ok') {
        throw new ApiError(400, `Failed to delete image from Cloudinary: ${result.result}`);
      }
  
      return result;
    } catch (error) {
      // Throw a new error with a custom message or fallback to the error's original message
      throw new ApiError(400, error.message || "Error deleting image from Cloudinary");
    }
  };
  
export {uploadOnCloudinary,deleteImagefromCloudinary}