//configuration file for passport middleware (passport should be given as an argument.)
const passport = require("passport");
const LocalStrategy = require("passport-local");
//require db through prisma?

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");

module.exports = function (passport) {
  const strategy = new LocalStrategy(async function verify(
    user,
    password,
    done
  ) {
    // 1: database query
    try {
      // Use Prisma to find the user by username
      const user = await prisma.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        return done(null, false, {
          message: "Incorrect username or password.",
        });
      }

      // 2: verify encrypted password with bcrypt compare
      const match = await bcrypt.compare(password, user.hashedPassword);
      if (!match) {
        return done(null, false, {
          message: "Incorrect username or password.",
        });
      }

      // 3: implement serialize and deserialize functions

      //
    } catch (err) {
      return done(err);
    }
  });
};
