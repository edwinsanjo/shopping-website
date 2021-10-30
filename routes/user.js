var express = require('express');
const { USER_COLLECTION } = require('../config/collections');
var productHelper = require("../helpers/product-helper");
const userHelpers = require('../helpers/user-helpers');
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
router.get('/', async function(req, res, next) {
  let user = req.session.user
  let cartCount = null
  if(req.session.user){
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount });
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
    req.session.loggedIn = true
    req.session.user = response
    res.redirect("/")
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

router.get("/cart", verifyLogin, async(req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  res.render("user/cart",{products,user:req.session.user})
})

router.get("/add-to-cart/:id", (req, res) => {
  console.log("api called");
  userHelpers.addToCart(req.params.id,req.session.user._id).then((response) => {
    // res.redirect("/")
  })
})

module.exports = router;
