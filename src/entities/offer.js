/*
  Order Entity
  An order is created when a new Signal is detected via the P2WDB webhook.
  It's destroyed when the UTXO described in the Signal has been detected as spent.
*/
class OrderEntity {
  constructor () {
    this.orderStatus = ['posted', 'taken', 'completed']
  }

  validate (orderData = {}) {
    // Throw an error if input object does not have a data property
    if (!orderData.data) {
      throw new Error(
        'Input to order.validate() must be an object with a data property.'
      )
    }

    const {
      messageType,
      messageClass,
      tokenId,
      name,
      symbol,
      buyOrSell,
      rateInSats,
      minSatsToExchange,
      numTokens,
      utxoTxid,
      utxoVout,
      offerHash,
      txHex,
      addrReferences,
      orderStatus
    } = orderData.data

    // Input Validation
    if (!messageType || typeof messageType !== 'number') {
      throw new Error("Property 'messageType' must be an integer number.")
    }
    if (!messageClass || typeof messageClass !== 'number') {
      throw new Error("Property 'messageClass' must be an integer number.")
    }
    if (!tokenId || typeof tokenId !== 'string') {
      throw new Error("Property 'tokenId' must be a string.")
    }
    if (!name || typeof name !== 'string') {
      throw new Error("Property 'name' must be a string.")
    }
    if (!symbol || typeof symbol !== 'string') {
      throw new Error("Property 'symbol' must be a string.")
    }
    if (!buyOrSell || typeof buyOrSell !== 'string') {
      throw new Error("Property 'buyOrSell' must be a string.")
    }
    if (!rateInSats || typeof rateInSats !== 'number') {
      throw new Error("Property 'rateInSats' must be an integer number.")
    }
    if (!minSatsToExchange || typeof minSatsToExchange !== 'number') {
      throw new Error(
        "Property 'minSatsToExchange' must be an integer number."
      )
    }
    if (!numTokens || typeof numTokens !== 'number') {
      throw new Error("Property 'numTokens' must be a number.")
    }
    if (!utxoTxid || typeof utxoTxid !== 'string') {
      throw new Error("Property 'utxoTxid' must be a string.")
    }
    if (typeof utxoVout !== 'number') {
      throw new Error("Property 'utxoVout' must be an integer number.")
    }

    if (orderStatus && !this.orderStatus.includes(orderStatus)) {
      throw new Error("Property 'orderStatus' must be a valid string")
    }

    const validatedOrderData = {
      messageType,
      messageClass,
      tokenId,
      name,
      symbol,
      buyOrSell,
      rateInSats,
      minSatsToExchange,
      numTokens,
      utxoTxid,
      utxoVout,
      orderStatus: orderStatus || this.orderStatus[0],
      txHex, // Hex serialized transaction.
      addrReferences, // Addresses that control UTXOs used in transaction.
      timestamp: orderData.timestamp,
      localTimestamp: orderData.localTimeStamp,
      txid: orderData.txid,
      p2wdbHash: orderData.hash,
      offerHash: offerHash || orderData.hash
    }

    return validatedOrderData
  }

  validateFromModel (model) {
    return this.validate({
      data: model,
      timestamp: model.timestamp,
      localTimeStamp: model.localTimeStamp,
      txid: model.txid,
      hash: model.p2wdbHash
    })
  }
}

module.exports = OrderEntity
