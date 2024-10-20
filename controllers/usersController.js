const { body, validationResult } = require("express-validator");

const passport = require("passport");
require("../config/passport");

const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const { userInfo } = require("os");

const prisma = new PrismaClient();

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
      console.log("debug: error during authentication", info);
      return next(err); // THIS LINE -- LEADS TO A WHITE SCREEN?
    }
    if (!user) {
      console.log("debug: user not found.");
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

// TODO: write POST route for post-file.

// TODO: write GET route for get-files.

const files_post = async function (req, res, next) {
  // file upload to DISK is handled by multer.
  // TODO : ensure that filename is set before uploading.
  // file upload to DATABASE:

  console.log(req.user.id);

  //ensure user is logged in
  if (req.user.id) {
    console.log(req.file);

    const customFileName = req.body.fileName;
    const userId = req.user.id;
    const filePath = req.file.path;
    console.log("path:", filePath);

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

    try {
      const item = await prisma.file.create({
        data: {
          userId: userId,
          name: customFileName,
          folderId: fileFolder.id,
          path: filePath,
        },
      });
      console.log("uploaded:");
      console.log(item);
    } catch (err) {
      console.log("error uploading file");
      res.status(400).send("error uploading file.");
    }
  } else {
    console.log("error: not logged in.");
  }

  //TODO: redirect to file with new folder
  res.redirect("/");
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
  console.log("make new folder of name:", customName);
  const userId = req.user.id;
  console.log("debug: userId: ", userId);

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

  console.log("attempting to ID: ", req.body.openFolderId);
  const folderId = parseInt(req.body.openFolderId);
  console.log(req.body);

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
