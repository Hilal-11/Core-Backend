import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // upload succeeded — remove the temp file from your server's disk
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // upload failed — still remove the temp file, don't leave garbage on disk
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;
    const response = await cloudinary.uploader.destroy(public_id);
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };