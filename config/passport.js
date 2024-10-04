//configuration file for passport middleware
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

//accessing db through prisma
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");

//Configure Passport to use LocalStrategy
passport.use(
  "local", // essential name of strategy
  new LocalStrategy(async (username, password, done) => {
    try {
      //debug
      console.log("attempting to find user (from passport config)");

      const user = await prisma.user.findFirst({
        where: { username: username },
      });

      if (!user) {
        //user not found in db
        return done(null, false, { message: "incorrect username." });
      }

      //HERE IS WHAT IS MISSING
      //---------------------------------------------
      //TODO: compare passwords here

      bcrypt.compare(password, user.password, function (isMatch, err) {
        if (err) {
          return done(err); // if there is an error, pass it to passport
        }

        if (isMatch) {
          return done(null, user);
        } else {
          //no match
          return done(null, false, { message: "Incorrect password." });
        }
      });

      // docs here:
      // http://www.passportjs.org/concepts/authentication/password/

      //------------------------------

      // TODO: return res with authenticated user (?)
    } catch (err) {
      return done(err);
    }
  })
);

module.exports = passport;
