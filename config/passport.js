//configuration file for passport middleware (passport should be given as an argument.)
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

//accessing db through prisma
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");

//Configure Passport to use LocalStrategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      //get data from db (async)
      //TODO: use a prisma function like findOne

      //temp
      console.log("somethings");

      if (!user) {
        //user not found in db
        return done(null, false, { message: "incorrect username." });
      }
      //TODO: compare passwords here
    } catch (err) {
      return done(err);
    }
  })
);
