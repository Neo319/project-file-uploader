// configuration for cloudinary API

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dabwu9ydw",
  secure: true,

  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
