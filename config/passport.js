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
      const user = await prisma.user.findFirst({
        where: { username: username },
      });

      //temp
      console.log(`FOUND user : ${user}`);

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

module.exports = passport;
