const db = require("../config/connection")
const collection = require("../config/collections")
var bcrypt = require("bcrypt")
var objectId = require("mongodb").ObjectId

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
        return new Promise(async(resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart) {
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId)},
                {
                    $push:{products:objectId(productId)}
                }).then((data) => {
                    resolve()
                })
            }else {
                let cartObj = {
                    user: objectId(userId),
                    products: [objectId(productId)]
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
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: {prodList:"$products"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id","$$prodList"]
                                    }
                                }
                            }
                        ],
                        as: "cartItems"
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    },

    getCartCount : (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart) {
                count = cart.products.length
            }
            resolve(count)
            
        })
    }
}