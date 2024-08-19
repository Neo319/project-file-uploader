const express = require("express");
const { body, validationResult } = require("express-validator");

const passport = require("passport");
const bcrypt = require("bcryptjs");

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");

// --------- ROUTES ---------

exports.homepage_get = function (req, res, next) {
  res.render("index", { title: "Homepage" });
};

exports.sign_up_get = function (req, res) {
  res.render("sign-up-form", { title: "Sign Up" });
};

// --- POST new user to database. ---
exports.sign_up_post = [
  //validate & sanitize
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters")
    .escape(),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters")
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
        const user = {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          username: req.body.username,
          password: hashedPassword,
        };
        // const result = await db.insertUser(user);
        // --------- TODO: must be overwritten with prisma query ---------
        res.redirect("/");
      } catch (err) {
        return next(err);
      }
    });
  },
];
