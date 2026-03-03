const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Vercel/serverless: only /tmp is writable
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dsffxqf8f',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadfile = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not configured (missing CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET)');
    }
    const responsefromcloud = await cloudinary.uploader.upload(localfilepath, {
      resource_type: 'auto',
    });
    try {
      fs.unlinkSync(localfilepath);
    } catch (_) {
      // ignore
    }
    return responsefromcloud;
  } catch (err) {
    console.error('Cloudinary upload failed:', err?.message || err);
    try {
      if (localfilepath) fs.unlinkSync(localfilepath);
    } catch (_) {
      // ignore
    }
    return null;
  }
};

const deletefile = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('the file path is missing');
    }
    const response = await cloudinary.uploader.destroy(publicId);
    console.log(response);
    return response;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = {
  upload,
  uploadfile,
  deletefile
}; 
