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
const deletefromCloudinary = async (url) => {
  try {
    if (!url) return false;

    // Extract the public ID from the Cloudinary URL
    const publicIdMatch = url.match(/\/upload\/v\d+\/(.+?)(?:\.\w+)?$/);
    const publicId = publicIdMatch ? publicIdMatch[1] : null;

    if (!publicId) {
      console.log("No public ID found in the URL");
      return false;
    }

    console.log("Deleting image from Cloudinary...");

    const deleteResult = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });

    console.log("Delete result:", deleteResult);
    return deleteResult;
  } catch (error) {
    console.log("CLOUDINARY :: FILE Delete ERROR ", error);
    return false;
  }
};



export {uploadOnCloudinary,deletefromCloudinary}