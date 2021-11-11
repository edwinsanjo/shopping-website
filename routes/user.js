var express = require('express');
var productHelper = require("../helpers/product-helper");
const userHelpers = require('../helpers/user-helpers');
var userHelper = require("../helpers/user-helpers")
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if(req.session.userloggedIn) {
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
  if(req.session.user){
    res.redirect("/")
  }else {

    res.render("user/login", {"loginErr": req.session.userLoginErr})
    req.session.userLoginErr = false
  }
})

router.get("/signup", function(req, res) {
  res.render("user/signup")
})

router.post("/signup", (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.user = response
    req.session.loggedIn = true
    res.redirect("/")
  })
})

router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if(response.status){

      req.session.user = response.user
      req.session.admin = response.admin
      req.session.loggedIn = true
      res.redirect("/")
    }else{
      req.session.loginErr = "Invalid Username or Password"
      res.redirect("/login")
    }
  })
})

router.get("/logout", (req, res) => {
  req.session.user = null
  req.session.admin = false
  res.redirect("/")
})

router.get("/cart", verifyLogin, async(req, res) => {
  
  let products = await userHelper.getCartProducts(req.session.user._id)
  if(products.length >0){
    let total = 0
  }
  total = await userHelper.getTotalAmount(req.session.user._id)
  res.render("user/cart",{products,user:req.session.user,total})
})

router.get("/add-to-cart/:id", (req, res) => {
  console.log("api called");
  userHelpers.addToCart(req.params.id,req.session.user._id).then((response) => {
    res.json({status: true})
  })
})

router.post("/change-product-quantitiy", (req, res,next) => {
  
  userHelpers.changeProductQuantity(req.body).then(async(response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)

  })
})

router.post("/remove-from-cart/", (req,res,next) => {
    console.log(req.body);
    userHelpers.removeFromCart(req.body.product, req.body.cart).then((data) => {
      res.json({status:true})
  })
})

router.get("/place-order",verifyLogin, async (req,res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render("user/place-order",{total,user:req.session.user})
})

router.post("/place-order", verifyLogin, async(req,res) => {
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId) => {
    if(req.body['payment-method'] === "COD"){
      res.json({status:true})
    }else{
      res.send("Online Payment Not Available")
}
  })
})

router.get("/order-success",(req,res) => {
  res.render("user/order-success",{user:req.session.user})
})

router.get("/orders", verifyLogin, async(req,res) => {
  let orders = await userHelper.getUserOrders(req.session.user._id)
  res.render("user/orders",{orders,user:req.session.user})
})

router.get("/view-order-products/:id", async(req,res) => {
  let products = await userHelper.getOrderProducts(req.params.id)
  res.render("user/view-order-products",{user:req.session.user,products})
})

module.exports = router;