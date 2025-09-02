const cloudinary = require('cloudinary').v2;
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const uploadToCloudinary = (filePath) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, { folder: "oralvis_scans" }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

module.exports = { cloudinary, uploadToCloudinary };