var express = require("express");
var router = express.Router();
const path = require("path");

const usersController = require("../controllers/usersController");

const multer = require("multer");

// Set up multer configuration once, outside of any route handler
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../tmp/uploads"),
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // getting the extension
    const re = /(?:\.([^.]+))?$/;
    const extension = re.exec(file.originalname);

    // file is uploaded
    cb(null, file.fieldname + "-" + uniqueSuffix + extension[0]);
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

// * GET files *
router.get("/get-files", usersController.files_get);

// * POST new folder created *
router.post("/new-folder", usersController.new_folder);
// * POST update folder name *
router.post("/update-folder", usersController.update_folder);
// * GET delete folder & files *
router.post("/delete-folder", usersController.delete_folder);

// * GET file detail *
router.get("/file-detail/:id", usersController.file_detail);

module.exports = router;
