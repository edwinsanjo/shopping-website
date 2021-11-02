const db = require("../config/connection")
const collection = require("../config/collections")
var bcrypt = require("bcrypt")
var objectId = require("mongodb").ObjectId
const { getProductDetails } = require("./product-helper")
const { log } = require("debug")

module.exports={
    doSignup: (userData) => {
        return new Promise(async(resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)

            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(db.get().collection(collection.USER_COLLECTION).findOne(data.insertedId))
            })

        })
    },

    doLogin: (userData) => {
        return new Promise(async(resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email: userData.Email})
            if(user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if(status) {
                        console.log("login sucess");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else {
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }else {
                console.log("email not found");
                resolve({status:false})
            }
        })
    },

    addToCart: (productId, userId) => {
        let productObj = {
            item: objectId(productId),
            quantity:1,
        }
        return new Promise(async(resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart) {
                let productExist = userCart.products.findIndex(product => product.item == productId)
                console.log(productExist)
                if(productExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),"products.item": objectId(productId)},
                    {
                        $inc:{"products.$.quantity": 1}
                    }
                    ).then(() => {
                        resolve()
                    })
                }else {
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                        $push:{products:productObj}

                    }).then((data) => {
                        resolve()
                    })
                }
            }else {
                let cartObj = {
                    user: objectId(userId),
                    products: [productObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((data) => {
                    resolve()
                })
        }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async(resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {user:objectId(userId)}
                },
                {
                    $unwind:"$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: "_id",
                        as:'product'
                    }
                },
                {
                    $project: {
                        item:1,quantity:1,product:{
                            $arrayElemAt:["$product",0]
                        }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    getCartCount : (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart) {
                count = cart.products.length
            }
            resolve(count.product)
            
        })
    },

    changeProductQuantity: (details) => {
        let count = parseInt(details.count)
        console.log(count)

        return new Promise((resolve, reject) => {
            if(count == -1 && quantitiy ==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id: objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(product)}}
                }
                ).then((response) => {

                    resolve({removeProduct: true})
                })
            }else{

                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id: objectId(details.cart) ,"products.item": objectId(details.product)},
                {
                    $inc:{"products.$.quantity": count}
                }
                    ).then(async(res) => {
                        
                        resolve({status:true}) 
                    })
                }
        })
    },

    removeFromCart: (productId, cartId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id: objectId(cartId)},
            {
                $pull:{products:{item:objectId(productId)}}
            }).then((response) => {
                resolve()
            })


        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async(resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {user:objectId(userId)}
                },
                {
                    $unwind:"$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: "_id",
                        as:'product'
                    }
                },
                {
                    $project: {
                        item:1,quantity:1,product:{
                            $arrayElemAt:["$product",0]
                        }
                    }
                },
                {
                    $group: {
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
            ]).toArray()
            console.log(total[0].total);
            resolve(total[0].total)
        })
    },
}