var express = require("express");
var router = express.Router();

const usersController = require("../controllers/usersController");

/* GET home page. */
router.get("/", usersController.homepage_get);

router.get("/sign-up", usersController.sign_up_get);
router.post("/sign-up", usersController.sign_up_post);

module.exports = router;
