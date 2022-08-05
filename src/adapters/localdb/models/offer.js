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
  rateInSats: { type: String },
  minSatsToExchange: { type: String },
  numTokens: { type: Number },
  signature: { type: String }, // this seems to be disposable now
  sigMsg: { type: String }, // this seems to be disposable now
  utxoTxid: { type: String },
  utxoVout: { type: Number },

  txHex: { type: String }, // hex of partial transaction.
  addrReferences: { type: String }, // Metadata needed when passing AVAX partial TXs.
  hdIndex: { type: Number }, // HD index address holding the UTXO for this offer.

  // Tracks ipfs-coord node that is managing this offer.
  offerIpfsId: { type: String },
  offerBchAddr: { type: String },
  offerPubKey: { type: String },

  p2wdbHash: { type: String }
})

module.exports = mongoose.model('offer', Offer)
