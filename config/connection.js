const mongoClient = require("mongodb").MongoClient

const state = {
    db: null
}

module.exports.connect = (done) => {
    const url = "mongodb+srv://EDWIN:EDWIN%40SANJO@projects.rwssd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    const dbName = "shopping"

    mongoClient.connect(url,(err,data) => {
        if(err) return done(err)
        state.db = data.db(dbName)
        done()
    })

}

module.exports.get = () => {
    return state.db
}