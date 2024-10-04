import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Handles any file type
    });

    // Log the success and return the response
    console.log("File is uploaded on Cloudinary:", response.url);

    // Delete the local file after uploading to Cloudinary
    fs.unlinkSync(localFilePath);

    // Return the Cloudinary response object (or just the URL if preferred)
    return response;

  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);

    // Remove the locally saved temporary file if the upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null; // Return null to indicate failure
  }
};

export { uploadOnCloudinary };
