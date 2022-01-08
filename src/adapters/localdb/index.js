/*
  This library encapsulates code concerned with MongoDB and Mongoose models.
*/

// Load Mongoose models.
const Users = require('./models/users')
const Entries = require('./models/entry')
const Order = require('./models/order')
const Offer = require('./models/offer')

class LocalDB {
  constructor () {
    // Encapsulate dependencies
    this.Users = Users
    this.Entry = Entries
    this.Order = Order
    this.Offer = Offer
  }
}

module.exports = LocalDB
