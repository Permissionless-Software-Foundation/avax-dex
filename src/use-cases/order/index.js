/*
  Use Case library for Orders.
  Orders are created by a webhook trigger from the P2WDB. Orders are a result of
  new data in P2WDB. They differ from Offers, which are generated by a local
  user.
  An Order is created to match a local Offer, but it's created indirectly, as
  a response to the webhook from the P2WDB. In this way, Orders generated from
  local Offers are no different than Orders generated by other peers.
*/

const OrderEntity = require('../../entities/order')

class OrderUseCases {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Order Use Cases library.'
      )
    }

    this.orderEntity = new OrderEntity()
    this.OrderModel = this.adapters.localdb.Order
  }

  // This method is called by the POST /order REST API controller, which is
  // triggered by a P2WDB webhook.
  async createOrder (orderObj) {
    try {
      console.log('Use Case createOrder(orderObj): ', orderObj)

      // console.log('this.adapters.bchjs: ', this.adapters.bchjs)

      // Verify that UTXO in order is unspent. If it is spent, then ignore the
      // order.
      const txid = orderObj.data.utxoTxid
      const vout = orderObj.data.utxoVout

      const utxoStatus = await this.adapters.wallet.getTxOut(txid, vout)
      console.log('utxoStatus: ', utxoStatus)
      if (!utxoStatus) return false

      const orderEntity = this.orderEntity.validate(orderObj)
      console.log('orderEntity: ', orderEntity)

      // Add order to the local database.
      const orderModel = new this.OrderModel(orderEntity)
      await orderModel.save()

      return true
    } catch (err) {
      console.error('Error in use-cases/order/createOrder()', err)
      throw err
    }
  }

  async listOrders () {
    try {
      return this.OrderModel.find({})
    } catch (error) {
      console.error('Error in use-cases/order/listOrders()')
      throw error
    }
  }

  // 'take' an order by completing the second half of the partial transaction.
  // Write the partially-signed tx to the P2WDB and send a signal to the maker.
  async takeOrder (entryObj) {
    try {
      console.log('Use-Case takeOrder(entryObj):', entryObj)
      const { txHex, addrReferences, p2wdbHash, orderStatus } = entryObj

      // Ensure the order is in a 'posted' state and not already 'taken'
      if (orderStatus && orderStatus !== 'posted') {
        throw new Error('order already taken')
      }

      // Prepare to write to the P2WDB.
      await this.adapters.wallet.bchWallet.walletInfoPromise
      await this.adapters.p2wdb.checkForSufficientFunds(
        this.adapters.wallet.bchWallet.walletInfo.privateKey
      )

      // Complete the partial-transaction, taking the other side of the trade.
      const reference = JSON.parse(addrReferences)
      const partialTx = await this.adapters.wallet.takePartialTxHex(
        txHex,
        reference
      )

      // The P2WDB hash of the 'posted' Order.
      entryObj.offerHash = p2wdbHash

      // Delete properties from the original Order.
      delete entryObj.p2wdbHash
      delete entryObj.timestamp
      delete entryObj.localTimestamp
      delete entryObj.txid

      // Update the state of the Order to reflect that it has been 'taken'.
      entryObj.orderStatus = 'taken'
      entryObj.txHex = partialTx.txHex
      entryObj.addrReferences = partialTx.addrReferences

      // Write the updated order information to the P2WDB.
      const hash = await this.adapters.p2wdb.write({
        wif: this.adapters.wallet.bchWallet.walletInfo.privateKey,
        data: entryObj,
        appId: 'swapTest555'
      })

      return hash
    } catch (err) {
      console.log('Error in use-cases/takeOrder())', err)
      throw err
    }
  }

  async completeOrder (entryObj) {
    try {
      console.log('Use-Case completeOrder(entryObj):', entryObj)
      const { offerTxHex, orderEntity, hdIndex } = entryObj
      const { txHex, addrReferences, orderStatus } = orderEntity

      // Ensure the order is in a 'taken' state and not already 'completed' or just 'posted'
      if (orderStatus && orderStatus !== 'taken') {
        throw new Error('orderStatus must be taken')
      }

      // Prepare to write to the P2WDB.
      await this.adapters.wallet.bchWallet.walletInfoPromise
      await this.adapters.p2wdb.checkForSufficientFunds(
        this.adapters.wallet.bchWallet.walletInfo.privateKey
      )

      // Delete properties from the original Order.
      delete entryObj.p2wdbHash
      delete entryObj.timestamp
      delete entryObj.localTimestamp
      delete entryObj.txHex
      delete entryObj.addrReferences

      const { valid, message } = await this.adapters.wallet.validateIntegrity(offerTxHex, txHex)

      if (!valid) {
        throw new Error(message)
      }
      const reference = JSON.parse(addrReferences)
      const txid = await this.adapters.wallet.completeTxHex(txHex, reference, hdIndex)
      entryObj.txid = txid
      entryObj.orderStatus = 'accepted'

      // Write the updated order information to the P2WDB.
      const hash = await this.adapters.p2wdb.write({
        wif: this.adapters.wallet.bchWallet.walletInfo.privateKey,
        data: entryObj,
        appId: 'swapTest555'
      })

      return { txid, hash }
    } catch (error) {
      console.error('Error in completeOrder(): ', error)
      throw error
    }
  }

  async findOrderByHash (p2wdbHash) {
    try {
      if (typeof p2wdbHash !== 'string' || !p2wdbHash) {
        throw new Error('p2wdbHash must be a string')
      }

      const order = await this.OrderModel.findOne({ p2wdbHash })

      if (!order) {
        throw new Error('order not found')
      }

      const orderObject = order.toObject()
      return this.orderEntity.validateFromModel(orderObject)
    } catch (err) {
      console.error('Error in findOrder(): ', err)
      throw err
    }
  }

  async findOrder (orderId) {
    try {
      const order = await this.OrderModel.findById(orderId)

      if (!order) {
        throw new Error('order not found')
      }

      const orderObject = order.toObject()
      return this.orderEntity.validateFromModel(orderObject)
    } catch (err) {
      console.error('Error in findOrder(): ', err)
      throw err
    }
  }

  async checkTakenOrder (offerHash) {
    try {
      const order = await this.OrderModel.findOne({ offerHash, orderStatus: 'taken' })

      if (!order) {
        return false
      }

      const orderObject = order.toObject()
      return this.orderEntity.validateFromModel(orderObject)
    } catch (err) {
      console.error('Error in checkTakenOrder(): ', err)
      throw err
    }
  }
}

module.exports = OrderUseCases
