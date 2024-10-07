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
      const user = await prisma.user.findFirst({
        where: { username: username },
      });

      if (!user) {
        //user not found in db
        return done(null, false, { message: "incorrect username." });
      }

      bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) {
          return done(err); // if there is an error, pass it to passport
        }

        if (isMatch) {
          console.log("debug: user was matched. attempting authentication...");
          // -------------- TODO: INITIALIZE SESSION SUPPORT --------------
          //FAILING TO SERIALIZE USER HERE
          return done(null, user);
        } else {
          //no match
          return done(null, false, { message: "Incorrect password." });
        }
      });

      // docs here:
      // http://www.passportjs.org/concepts/authentication/password/

      //------------------------------

      // here is where we write serialize and deserialize
      passport.serializeUser(function (user, cb) {
        process.nextTick(function () {
          return cb(null, {
            id: user.id,
            username: user.username,
          });
        });
      });

      passport.deserializeUser(function (user, cb) {
        process.nextTick(function () {
          return cb(null, user);
        });
      });
    } catch (err) {
      return done(err);
    }
  })
);

module.exports = passport;
