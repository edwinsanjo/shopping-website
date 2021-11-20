var express = require('express');
var router = express.Router();
var productHelper = require("../helpers/product-helper");
const userHelpers = require('../helpers/user-helpers');

const verifyAdmin = (req, res, next) => {
  if(req.session.admin) {
    next()
  }else {
    res.redirect("/404")
  }
}

/* GET users listing. */
router.get('/', verifyAdmin, (req, res, next) => {
  productHelper.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, admin: true })
  })

});

router.get("/add-product", verifyAdmin, (req, res) => {
  res.render("admin/add-product",{ admin: true })
})

router.post("/add-product", verifyAdmin, (req, res) => {
  req.body.Price = parseInt(req.body.Price)
  productHelper.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/images/product-images/'+id+'.png', (err,done)=>{
      if(!err){
         
        res.render("admin/add-product",{ admin: true })
      }
    })
  })

})

router.get("/delete-product/:id", verifyAdmin, (req, res) => {
  let productId = req.params.id
  productHelper.deleteProduct(productId).then((data) => {
    res.redirect("/admin")
  })
})

router.get("/edit-product/:id", verifyAdmin, async(req,res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  console.log(product);
  res.render("admin/edit-product",{ admin: true, product })
})

router.post("/edit-product/:id", verifyAdmin, (req,res) => {
  productHelper.updateProduct(req.params.id, req.body).then((data) => {
    res.redirect("/admin")
    let image = req.files.Image
    if (req.files.Image){
      image.mv('./public/images/product-images/'+req.params.id+'.png', (err,done)=>{
        if(!err){
           
          res.render("admin/edit-product", { admin: true })
        }
      })
    }
})
})

router.get("/get-all-users", verifyAdmin, async(req,res) => {
  let user = await userHelpers.getAllUsers().then((users) => {
    console.log(users);
    res.render("admin/view-users", { admin: true, users})
  })
})

router.get("/delete-user/:id", verifyAdmin, (req,res) => {
  userHelpers.deleteUser(req.params.id).then((data) => {
    res.redirect("/admin/get-all-users")
  })
}),

router.get("/all-orders", verifyAdmin, (req,res) => {
  productHelper.getAllOrders().then((orders) => {
    console.log(orders);
    res.render("admin/view-orders", { admin: true, orders })
  })
})

module.exports = router;
