const passport = require("passport");
const LocalStrategy = require("passport-local");
//require db through prisma?

const prisma = require("@prisma/client").PrismaClient;
const db = new prisma();

module.exports = function (passport) {
  // ...
  // TODO : configure passport using prisma framework

  const strategy = new LocalStrategy(function verify(user, password, done) {
    // 1: database query
    db.user
      .findUnique({
        where: { username: username },
      })
      .then((user) => {
        if (!user) {
          return done(null, false, {
            message: "Incorrect username or password.",
          });
        }
      });

    // 2: encrypt with bcrypt

    // 3: implement serialize and deserialize functions
  });
};
