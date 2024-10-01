//configuration file for passport middleware
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

      //debug

      console.log("attempting to find user (from passport config)");

      const user = await prisma.user.findFirst({
        where: { username: username },
      });

      //temp
      console.log(`FOUND user : ${user}`);

      if (!user) {
        //user not found in db
        return done(null, false, { message: "incorrect username." });
      }

      //HERE IS WHAT IS MISSING
      //---------------------------------------------
      //TODO: compare passwords here

      //bcrypt.compare()  ??

      bcrypt.compare(password, user.password, function (err, res) {
        // something ... handle errors and response here
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
