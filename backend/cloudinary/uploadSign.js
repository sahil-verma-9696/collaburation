import { v2 as cloudinary } from "cloudinary";
import { configDotenv } from "dotenv";

configDotenv();

// Server-side function used to sign an upload with a couple of
// example eager transformations included in the request.
const signuploadform = (folderName) => {
  const expirySeconds = 300; // 5 minutes
  const timestamp = Math.round((Date.now() + expirySeconds * 1000) / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      eager: "c_pad,h_300,w_400|c_crop,h_200,w_260",
      folder: folderName,
    },
    process.env.CLOUDINARY_SECRET
  );

  return { timestamp, signature };
};

export default signuploadform;
