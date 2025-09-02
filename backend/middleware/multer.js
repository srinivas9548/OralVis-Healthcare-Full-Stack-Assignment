const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (request, file, cb) => cb(null, uploadDir),
    filename: (request, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter: Allow only JPG/PNG
const fileFilter = (request, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase().slice(1));
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG and PNG images are allowed!"));
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;