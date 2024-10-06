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
const deleteImagefromCloudinary = async (URL) => {
  try {
    if (!URL) return false;

    let ImageId = URL.match(
      /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
    )[2];

    console.log("deleting image from cloudinary...");

    const cldnry_res = await cloudinary.uploader.destroy(
      `videotube/photos/${ImageId}`,
      {
        resource_type: "image",
      }
    );

    return cldnry_res;
  } catch (error) {
    console.log("CLOUDINARY :: FILE Delete ERROR ", error);
    return false;
  }
};
export {uploadOnCloudinary,deleteImagefromCloudinary}