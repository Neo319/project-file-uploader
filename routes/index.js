var express = require("express");
var router = express.Router();
const path = require("path");

const usersController = require("../controllers/usersController");

const multer = require("multer");

// Set up multer configuration once, outside of any route handler
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../tmp/uploads"),
  filename: function (req, file, cb) {
    const originalName = file.name;

    //custom name should be the inputted value trimmed, or else the original file name.
    const customFileName = req.body.fileName
      ? req.body.fileName.trim()
      : originalName;

    const fileExtension = path.extname(file.originalname);

    // applying the name to the file.
    cb(null, `${customFileName}${fileExtension}`);
  },
});

const upload = multer({ storage: storage });

/* GET home page. */
router.get("/", usersController.homepage_get);

router.post("/log-in", usersController.login_post);

router.get("/log-out", usersController.logout_get);

router.get("/sign-up", usersController.sign_up_get);
router.post("/sign-up", usersController.sign_up_post);

// * POST new files *
router.post(
  "/post-files",
  upload.single("fileInput"),
  usersController.files_post
);

// * GET new files *
router.get("/get-files", usersController.files_get);

// * POST new folder created *
router.post("/new-folder", usersController.new_folder);

module.exports = router;
