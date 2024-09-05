const passport = require("passport");
const LocalStrategy = require("passport-local");
//require db through prisma?

app.use("/", indexRouter);

module.exports = function (passport) {
  // ...
  // TODO : configure passport using prisma framework
};
