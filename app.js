require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const expressSession = require("express-session");

// passport configuration
const passport = require("passport");
require("./config/passport");

// here is where we write serialize and deserialize
passport.serializeUser(function (user, cb) {
  console.log("serializing...");
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
    });
  });
});

// TODO: error in this function?
passport.deserializeUser(function (user, cb) {
  console.log("deserializing...");
  process.nextTick(function () {
    return cb(null, user);
  });
});

// view engine setup
//TODO: test & revise if this line is necessary?
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// prisma session store setup
app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: "a santa at nasa",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

//initialize passport
app.use(passport.initialize());
app.use(passport.session());
app.use("/", indexRouter);

//TODO: Implement passport sessions HERE, as application-level middleware.

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
