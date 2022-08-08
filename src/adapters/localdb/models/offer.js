const mongoose = require('mongoose')

const Offer = new mongoose.Schema({
  // SWaP Protocol Properties
  lokadId: { type: String },
  messageType: { type: Number },
  messageClass: { type: Number },
  tokenId: { type: String },
  name: { type: String },
  symbol: { type: String },
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
  offerStatus: { type: String },

  localTimestamp: { type: String },
  p2wdbTxid: { type: String },
  p2wdbHash: { type: String },
  offerHash: { type: String },
  dataType: { type: String }
})

module.exports = mongoose.model('offer', Offer)
