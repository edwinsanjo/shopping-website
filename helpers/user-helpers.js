const db = require("../config/connection")
const collection = require("../config/collections")
var bcrypt = require("bcrypt")
var objectId = require("mongodb").ObjectId
const Razorpay = require("razorpay")
require("dotenv").config()

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
            if(user.admin){
                response.admin = true
            }
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
        let quantitiy = parseInt(details.quantity)
        console.log(count)

        return new Promise((resolve, reject) => {
            if(count == -1 && quantitiy ==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id: objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
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
        console.log(userId)
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
            if(total[0] == null) {
                resolve(0)
            }else {
                console.log(total)
                resolve(total[0].total)
            }
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async(resolve,reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },

    placeOrder: (order,products,total)=> {
        return new Promise((resolve,reject) => {
            console.log(order,products,total)
            let status = order["payment-method"] === "COD" ? "placed" : "pending"
            let orderObj = {
                delivery:{
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order["payment-method"],
                products:products,
                totoalAmount: total,
                status:status,
                date: new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                    console.log("data:*****************",data)
                    resolve(data.insertedId)
            })
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async(resolve,reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async(resolve,reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {_id:objectId(orderId)}
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
            resolve(order)
        })
    },
    getAllUsers:() => {
        return new Promise(async(resolve, reject) => {
            let product = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(product)
        })
    },
    deleteUser:(userId) => {
        return new Promise(async(resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userId)})
            resolve(user)
        })
    },

}
