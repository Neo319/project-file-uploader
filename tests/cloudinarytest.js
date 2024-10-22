// a test for the features of cloudinary.
// https://cloudinary.com/documentation/image_upload_api_reference
require("dotenv").config();
const path = require("path");

console.log("here!");

const cloudinary = require("../config/cloudinary");
const { isJsxFragment } = require("typescript");

const testFilePath = path.resolve(__dirname, "../tmp/test/Jupiter.jpeg");
console.log("absolute path: ", testFilePath);

const uploadFile = async function () {
  //upload test with no options

  try {
    console.log("upload begins");
    // TODO: determine and set relevant options
    await cloudinary.uploader
      .upload(testFilePath, {})
      .then((result) => console.log(result));
    console.log("upload should have completed.");
  } catch (err) {
    console.log("there was an error", err);
    console.error(err.message, err);
  }
};

uploadFile();

// TODO: save asset_id, format, created_at, bytes, url, secure_url, display_name, original_filename,

console.log("script completed");
