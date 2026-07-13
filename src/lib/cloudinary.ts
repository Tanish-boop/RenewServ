import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud_name';
const apiKey = process.env.CLOUDINARY_API_KEY || 'mock_api_key';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'mock_api_secret';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const generateCloudinarySignature = (folder = 'renewserv_receipts') => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Parameters to sign (must be alphabetical for signature generation)
  const paramsToSign = {
    folder,
    timestamp,
  };
  
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    apiSecret
  );

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  };
};

export default cloudinary;
