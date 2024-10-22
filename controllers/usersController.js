const { body, validationResult } = require("express-validator");
const path = require("path");

const fs = require("fs");

const passport = require("passport");
require("../config/passport");
const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const { userInfo } = require("os");
const prisma = new PrismaClient();

//cloudinary integration
const cloudinary = require("../config/cloudinary");

const cloudUpload = async function (file, options) {
  try {
    return await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream((error, uploadResult) => {
          return resolve(uploadResult);
        })
        .end(file);
    }).then((uploadResult) => {
      console.log(
        `Buffer upload-stream with promise success - ${uploadResult}`
      );
      return uploadResult;
    });
  } catch (err) {
    console.log("cloudUpload error");
    console.error(err.message, err);
    throw err;
  }
};

// --------- ROUTES ---------

const homepage_get = async function (req, res, next) {
  let user;
  let folders;
  if (req.user) {
    user = await prisma.user.findFirst({ where: { id: req.user.id } });
    folders = await prisma.folder.findMany({ where: { userId: req.user.id } });
  }

  res.render("index", { title: "Homepage", user: user, folders: folders });
};

//TODO: implement logging in from posting on index page (ensure use of prisma sessions...)

const login_post = function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err); // THIS LINE -- LEADS TO A WHITE SCREEN?
    }
    if (!user) {
      return res.redirect("/"); // Redirect to home
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      console.log("debug: successful login as user: ", user);
      return res.redirect("/");
    });
  })(req, res, next);
};

const logout_get = function (req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

const sign_up_get = function (req, res) {
  res.render("sign-up-form", { title: "Sign Up" });
};

// --- POST new user to database. ---
const sign_up_post = [
  //validate & sanitize
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 2 })
    .withMessage("Username must be at least 2 characters")
    .escape(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password must not be empty")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .escape(),

  body("confirm_password")
    .trim()
    .notEmpty()
    .withMessage("Password must not be empty")
    .escape()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm password must match the password");
      }
      return true;
    }),

  //asynchronously sign up to db if valid
  async function (req, res, next) {
    //ensure no errors
    const errors = validationResult(req);
    if (errors.length) {
      throw new Error("Error creating new user", errors);
    }

    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        console.log("bcrypt error");
        return next(err);
      }

      // TODO : create a new default file for each user

      try {
        const newUser = await prisma.user.create({
          data: {
            username: req.body.username,
            password: hashedPassword,
          },
        });

        await prisma.folder.create({
          data: {
            name: "file_(default)",
            userId: newUser.id,
          },
        });

        res.redirect("/");
      } catch (err) {
        return next(err);
      }
    });
  },
];

const files_post = async function (req, res, next) {
  // file upload to DISK is handled by multer.
  // TODO : ensure that filename is set before uploading.
  // file upload to DATABASE:
  console.log("file:");
  console.log(req.file);

  //ensure user is logged in
  if (req.user.id) {
    const customFileName = req.body.fileName;
    const userId = req.user.id;

    //find correct folder
    const fileFolder = await prisma.folder.findFirst({
      where: {
        userId: userId,
        name: req.body.fileFolder,
      },
    });

    if (!fileFolder) {
      console.log("folder not found.");
      res.status(400).send("folder not found");
    }

    console.log("folder: ", fileFolder);

    if (!customFileName || !req.file) {
      console.log("missing file or name.");
      console.log("file: ", req.file);
      res.status(400).send("missing file or name");
    }

    // getting necessary file information
    const re = /(?:\.([^.]+))?$/;
    const ext = re.exec(req.file.originalname)[1];

    // temp : TEST ------------
    // const result = await cloudUpload(req.file.buffer);

    // let asset_id;
    // let format;
    // let created_at;
    // let bytes;
    // let url;
    // let secure_url;
    // let display_name;
    // let original_filename;

    let uploadedFile = {};

    console.log("attempting");
    console.log(req.file);

    // -- upload to cloud via CLOUDINARY--
    try {
      uploadedFile = await cloudUpload(req.file.buffer, {
        display_name: customFileName,
        folder: "project-file-uploader",
      });
      console.log("uploaded to cloud:");
      console.log(uploadedFile);
    } catch (err) {
      console.log("error during cloud upload");
      console.error(err.message, err);
      return next(err);
    }

    // ------ file is created in database. ------
    try {
      const item = await prisma.file.create({
        data: {
          userId: userId,
          name: customFileName,
          folderId: fileFolder.id,
          path: uploadedFile.url,

          type: uploadedFile.format || null,
          size: uploadedFile.bytes.toString() || null,
        },
      });
      console.log("uploaded to prisma:");
      console.log(item);
      //TODO: redirect to file with new folder
      res.redirect("/get-files");
    } catch (err) {
      console.error(err.message || err);
      res.status(400).send("error uploading file.");
    }
  } else {
    console.log("error: not logged in.");
  }
};

const files_get = async function (req, res, next) {
  const user = await prisma.user.findFirst({ where: { id: req.user.id } });
  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
  });

  const openFolder = await prisma.folder.findFirst({
    where: { userId: user.id, name: req.query.openFolder },
  });

  console.log(user, folders, openFolder);

  let files = [];
  if (openFolder !== null) {
    files = await prisma.file.findMany({
      where: {
        folderId: openFolder.id,
      },
    });
  }

  res.render("get-files", {
    user: user,
    folders: folders,
    openFolder: openFolder,
    files: files,
  });
};

// *** folder CRUD ***
const new_folder = async function (req, res, next) {
  const customName = req.body.name.trim();
  const userId = req.user.id;

  // TODO: add folder to user obj as a string, which is appended to file destination...
  // access database and create a new folder, update user's folders

  if (customName !== "" && userId) {
    try {
      await prisma.folder.create({
        data: {
          name: customName,
          userId: userId,
        },
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  res.redirect("/get-files");
};

const update_folder = async function (req, res, next) {
  const customName = req.body.newName.trim();

  const folderId = parseInt(req.body.openFolderId);

  try {
    await prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name: customName,
      },
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }

  res.redirect("/get-files");
};

const delete_folder = async function (req, res, next) {
  const openFolderId = parseInt(req.body.openFolderId);
  try {
    await prisma.folder.delete({
      where: {
        id: openFolderId,
      },
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }

  res.redirect("/get-files");
};

// -------- Individual file detail --------
const file_detail = async function (req, res, next) {
  // display file details including name, size, upload time, download button.

  // temp: access via local disk.

  try {
    const file = await prisma.file.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    res.render("file-detail", { file: file });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports = {
  homepage_get,
  sign_up_get,
  sign_up_post,
  login_post,
  logout_get,

  files_post,
  files_get,

  new_folder,
  update_folder,
  delete_folder,

  file_detail,
};
