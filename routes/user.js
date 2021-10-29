var express = require('express');
var productHelper = require("../helpers/product-helper")
var userHelper = require("../helpers/user-helpers")
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if(req.session.loggedIn) {
    next()
  }else {
    res.redirect("/login")
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user
  console.log(user);
  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user });
  })

});

router.get("/login", function(req, res) {
  if(req.session.loggedIn){
    res.redirect("/")
  }else {
    res.render("user/login", {"loginErr": req.session.loginErr})
    req.session.loginErr = ""
  }
})

router.get("/signup", function(req, res) {
  res.render("user/signup")
})
router.post("/signup", (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
  })
})

router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if(response.status){
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect("/")
    }else{
      req.session.loginErr = "Invalid Username or Password"
      res.redirect("/login")
    }
  })
})

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

router.get("/cart", verifyLogin, (req, res) => {
  res.render("user/cart")
})

module.exports = router;
