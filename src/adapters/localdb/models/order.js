const mongoose = require('mongoose')

const Order = new mongoose.Schema({
  // SWaP Protocol Properties
  lokadId: { type: String },
  messageType: { type: Number },
  messageClass: { type: Number },
  tokenId: { type: String },
  buyOrSell: { type: String },
  rateInSats: { type: Number },
  minSatsToExchange: { type: Number },
  signature: { type: String },
  sigMsg: { type: String },
  utxoTxid: { type: String },
  utxoVout: { type: Number },
  numTokens: { type: Number },
  timestamp: { type: String },

  txHex: { type: String }, // hex of partial transaction.
  addrReferences: { type: String }, // Metadata needed when passing AVAX partial TXs.
  orderStatus: { type: String },

  localTimestamp: { type: String },
  p2wdbTxid: { type: String },
  p2wdbHash: { type: String },
  offerHash: { type: String }
})

module.exports = mongoose.model('order', Order)
