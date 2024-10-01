const express = require("express");
const { body, validationResult } = require("express-validator");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --------- ROUTES ---------

const homepage_get = function (req, res, next) {
  res.render("index", { title: "Homepage" });
};

//TODO: implement logging in from posting on index page (ensure use of prisma sessions...)

const login_post = function (req, res, next) {
  // This is where we use the local strategy established in passport config.

  //debug
  console.log("attempting login (from controller)");

  console.log("user passed to passport: ");
  console.log(user);

  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.redirect("/login"); // Redirect to login if authentication fails
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/"); // Redirect to home or intended page on success
    });
  })(req, res, next); // Important to call this function with req, res, next

  // TODO: determine why local is 'unknown strategy'
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

module.exports = {
  homepage_get,
  sign_up_get,
  sign_up_post,
  login_post,
  logout_get,
};
