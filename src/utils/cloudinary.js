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
        fs.unlinkSync(localFilePath)
         // remove the locally saved temporary file as the upload operation got failed
         console.error("CLOUDINARY :: FILE UPLOAD ERROR", error);
        return null;
    }
}
const deletefromCloudinary = async (url) => {
  try {
    if (!url) {
      console.log("No URL provided for deletion");
      return false;
    }

    // Extract the public ID and resource type from the Cloudinary URL
    const publicIdMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    const publicId = publicIdMatch ? publicIdMatch[1] : null;

    const resourceType = url.includes('/video/') ? 'video' : 'image'; // Determine resource type

    if (!publicId) {
      console.log("No public ID found in the URL");
      return false;
    }

    //console.log("Deleting from Cloudinary...");

    const deleteResult = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    //console.log("Delete result:", deleteResult);
    
    // Check the result for success
    if (deleteResult.result !== "ok") {
      console.log("Failed to delete the item from Cloudinary");
      return false;
    }

    return deleteResult;
  } catch (error) {
    console.log("CLOUDINARY :: FILE Delete ERROR ", error);
    throw error; // Re-throw the error to allow calling function to handle it
  }
};

export { uploadOnCloudinary, deletefromCloudinary };
