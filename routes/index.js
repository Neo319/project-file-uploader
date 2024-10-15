var express = require("express");
var router = express.Router();

const usersController = require("../controllers/usersController");

const multer = require("multer");

// Set up multer configuration once, outside of any route handler
const upload = multer({
  dest: "../uploads", // Adjust destination path as needed
});

/* GET home page. */
router.get("/", usersController.homepage_get);

router.post("/log-in", usersController.login_post);

router.get("/log-out", usersController.logout_get);

router.get("/sign-up", usersController.sign_up_get);
router.post("/sign-up", usersController.sign_up_post);

//how files can be posted
router.post(
  "/post-files",
  upload.single("fileInput"),
  usersController.files_post
);
router.post("/get-files", usersController.files_get);

module.exports = router;
