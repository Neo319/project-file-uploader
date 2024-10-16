const { body, validationResult } = require("express-validator");

const passport = require("passport");
require("../config/passport");

const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const { userInfo } = require("os");

const prisma = new PrismaClient();

// --------- ROUTES ---------

const homepage_get = function (req, res, next) {
  res.render("index", { title: "Homepage", user: req.user });
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

      try {
        await prisma.user.create({
          data: {
            username: req.body.username,
            password: hashedPassword,
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
  var isLoggedIn = typeof req.user !== "undefined" && req.user !== null;
  const file = req.file;
  const name = req.body.fileName.trim();

  console.log(file, name);

  res.send("debug, not implemented...");
  return null;

  // -------------- TODO: implement proper route handling for file uploads later.
  if (file === "" || name === "") {
    console.log("debug: missing file/name.");
    console.log(file, name);

    res.redirect("/");
    return null;
  }

  console.log("debug: loggedin = ", isLoggedIn);
  //ensuring user is logged in...
  if (isLoggedIn) {
    try {
      console.log("updating userID: ", req.user.id);

      // prepare file for upload. (create object)

      const upload = multer({ dest: "~/repos/file-editor-data/" });

      console.log(upload);

      // updating user to contain file

      // await prisma.user.update({
      //   where: {
      //     id: req.user.id,
      //   },
      //   data: {
      //     // get current user files, add new file
      //   },
      // });
    } catch (err) {
      return next(err);
    }
  }

  console.log("debug: reached end of post function...");

  res.redirect("/");
};

const files_get = async function (req, res, next) {
  const user = req.user;
  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
  });

  const openFolder = await prisma.folder.findFirst({
    where: { userId: user.id, name: req.query.openFolder },
  });

  res.render("get-files", {
    user: user,
    folders: folders,
    openFolder: openFolder,
  });
};

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

//TODO: update folder names; delete folders

module.exports = {
  homepage_get,
  sign_up_get,
  sign_up_post,
  login_post,
  logout_get,

  files_post,
  files_get,
  new_folder,
};
