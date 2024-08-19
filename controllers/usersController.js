const express = require("express");
const { body, validationResult } = require("express-validator");

const passport = require("passport");
const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --------- ROUTES ---------

const homepage_get = function (req, res, next) {
  res.render("index", { title: "Homepage" });
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

        //debug
        const allUsers = await prisma.user.findMany();

        console.log(allUsers);

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
};