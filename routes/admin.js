var express = require('express');
var router = express.Router();
var productHelper = require("../helpers/product-helper")

/* GET users listing. */
router.get('/', (req, res, next) => {
  productHelper.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, admin: true })
  })

});

router.get("/add-product", (req, res) => {
  res.render("admin/add-product")
})

router.post("/add-product", (req, res) => {
  req.body.Price = parseInt(req.body.Price)
  productHelper.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/images/product-images/'+id+'.png', (err,done)=>{
      if(!err){
         
        res.render("admin/add-product")
      }
    })
  })

})

router.get("/delete-product/:id", (req, res) => {
  let productId = req.params.id
  productHelper.deleteProduct(productId).then((data) => {
    res.redirect("/admin")
  })
})

router.get("/edit-product/:id", async(req,res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  console.log(product);
  res.render("admin/edit-product", {product})
})

router.post("/edit-product/:id", (req,res) => {
  productHelper.updateProduct(req.params.id, req.body).then((data) => {
    res.redirect("/admin")
    let image = req.files.Image
    if (req.files.Image){
      image.mv('./public/images/product-images/'+req.params.id+'.png', (err,done)=>{
        if(!err){
           
          res.render("admin/add-product")
        }
      })
    }
})
})

module.exports = router;
