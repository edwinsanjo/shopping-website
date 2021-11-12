var db = require("../config/connection")
var collection = require("../config/collections")
var objectId = require("mongodb").ObjectId

module.exports={

    addProduct: (product, callback) => {
        db.get().collection("product").insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },

    getAllProducts:(callback) => {
        return new Promise(async(resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((data) => {
                console.log(data);
                resolve(data)
            })
        })
    },

    getProductDetails: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)}).then((data) => {
                resolve(data)
            })
        })
    },

    updateProduct: (id, details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},{
                $set: {
                    Name: details.Name,
                    Description: details.Description,
                    Price: details.Price,
                    Category : details.Category} 
            }).then((data)=> {
                resolve(data)
            })
        })

    },
    getAllOrders: () => {
        return new Promise(async(resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },

}