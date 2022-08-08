
// Local libraries
const { wlogger } = require('../adapters/wlogger')
const OrderEntity = require('../entities/order')
const config = require('../../config')

class OrderLib {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Order Use Cases library.'
      )
    }

    // Encapsulate dependencies
    this.orderEntity = new OrderEntity()
    this.OrderModel = this.adapters.localdb.Order
    this.bch = this.adapters.bch
    this.config = config
  }

  // Create a new order model and add it to the Mongo database.
  async createOrder (entryObj) {
    try {
      console.log(
        `createOrder() entryObj: ${JSON.stringify(entryObj, null, 2)}`
      )

      // Input Validation
      const orderEntity = this.orderEntity.validate(entryObj)

      // Ensure sufficient AVAX tokens exist to create the order.
      await this.ensureFunds(orderEntity)

      // Ensure BCH wallet has finished initializing
      await this.adapters.wallet.bchWallet.walletInfoPromise

      // Ensure sufficient funds in the BCH wallet to make a P2WDB write.
      await this.adapters.p2wdb.checkForSufficientFunds(
        this.adapters.wallet.bchWallet.walletInfo.privateKey
      )

      // Move the tokens to holding address.
      const addressInfo = await this.getAddress()
      const utxoInfo = await this.moveTokens(orderEntity, addressInfo)
      console.log('utxoInfo: ', utxoInfo)

      // create partial tx with the token inputs and avax output
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(3000)
      const partialTx = await this.adapters.wallet.createPartialTxHex(
        orderEntity.rateInSats,
        addressInfo.privateKey
      )

      // Get the ticker and name of the token.
      const tokenTx = await this.adapters.wallet.getTransaction(entryObj.tokenId)
      // console.log('tokenTx: ', tokenTx)
      orderEntity.name = tokenTx.unsignedTx.transaction.name
      orderEntity.symbol = tokenTx.unsignedTx.transaction.symbol

      // Update the order with the new UTXO information and the partialTx information.
      orderEntity.utxoTxid = utxoInfo.txid
      orderEntity.utxoVout = utxoInfo.vout
      orderEntity.txHex = partialTx.txHex
      orderEntity.addrReferences = partialTx.addrReferences
      orderEntity.hdIndex = addressInfo.hdIndex
      orderEntity.dataType = 'offer'

      // Add order to P2WDB.
      const hash = await this.adapters.p2wdb.write({
        wif: this.adapters.wallet.bchWallet.walletInfo.privateKey,
        data: orderEntity,
        appId: this.config.appId
      })

      orderEntity.p2wdbHash = hash
      const orderEntry = new this.OrderModel(orderEntity)
      await orderEntry.save()
      // console.log('hash: ', hash)

      // Update the UTXO store in both wallets.
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(3000)
      await Promise.all([
        this.adapters.wallet.avaxWallet.getUtxos(),
        this.adapters.wallet.bchWallet.getUtxos()
      ])

      return hash
    } catch (err) {
      wlogger.error('Error in use-cases/createOrder())')
      console.log(err)
      throw err
    }
  }

  // Move the tokens indicated in the order to a temporary holding address.
  // This will generate the UTXO used in the Signal message. This function
  // moves the funds and returns the UTXO information.
  async moveTokens (orderEntity, addressInfo) {
    try {
      console.log('addressInfo: ', addressInfo)

      // Turn token into sats
      const assets = this.adapters.wallet.avaxWallet.utxos.assets
      const asset = assets.find(item => item.assetID === orderEntity.tokenId)
      const amount = orderEntity.numTokens * Math.pow(10, asset.denomination)

      const receiver = {
        address: addressInfo.address,
        amount,
        assetID: orderEntity.tokenId
      }
      console.log(`receiver: ${JSON.stringify(receiver, null, 2)}`)

      // Update the AVAX UTXO store
      // console.log('this.adapters.wallet.avaxWallet.walletInfo: ', this.adapters.wallet.avaxWallet.walletInfo)
      // const avaxAddr = this.adapters.wallet.avaxWallet.walletInfo.address
      // await this.adapters.wallet.avaxWallet.utxos.initUtxoStore(avaxAddr)

      // console.log('avax utxoStore: ', this.adapters.wallet.avaxWallet.utxos.utxoStore)

      // Broadcast the transaction to move the tokens.
      const txid = await this.adapters.wallet.avaxWallet.send([receiver])

      // Wait a few seconds for the network to update its UTXO state.
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(3000)

      // Find the vout for the transaction.
      const { vout } = await this.adapters.wallet.findTxOut(txid, receiver)

      return { txid, vout }
    } catch (err) {
      console.error('Error in moveTokens(): ', err)
      throw err
    }
  }

  // Ensure that the wallet has enough AVAX and tokens to complete the trade.
  async ensureFunds (orderEntity) {
    try {
      // Get Assets.
      const assets = this.adapters.wallet.avaxWallet.utxos.assets

      // Sell Order
      if (orderEntity.buyOrSell.includes('sell')) {
        const asset = assets.find(item => item.assetID === orderEntity.tokenId)

        // Turn token into sats
        const denomination = asset.denomination || 0
        const amount = orderEntity.numTokens * Math.pow(10, denomination)
        if (!asset || asset.amount < amount) {
          throw new Error(
            'App wallet does not have enough tokens to satisfy the SELL order.'
          )
        }
      } else {
        // Buy Order
      }

      return true
    } catch (err) {
      console.error('Error in ensureFunds()')
      throw err
    }
  }

  // Avax: retrieves a new key pair from the HD key ring as an object that contains a private key,
  // public address, and the index of the HD wallet that the key pair was generated from.
  async getAddress (hdIndex) {
    try {
      const keypair = await this.adapters.wallet.getAvaxKeyPair(hdIndex)

      return {
        address: keypair.getAddressString(),
        privateKey: keypair.getPrivateKeyString(),
        publicKey: keypair.getPublicKeyString(),
        hdIndex: keypair.hdIndex
      }
    } catch (error) {
      console.log(`Error on order/getAddress(): ${error.message}`)
      throw error
    }
  }

  async listOrders () {
    try {
      return this.OrderModel.find()
    } catch (error) {
      console.log(`Error on order/listOrders(): ${error.message}`)
      throw error
    }
  }

  async findOrderByHash (p2wdbHash) {
    console.log('findOrderByHash() p2wdbHash: ', p2wdbHash)

    try {
      if (typeof p2wdbHash !== 'string' || !p2wdbHash) {
        throw new Error('p2wdbHash must be a string')
      }

      const order = await this.OrderModel.findOne({ p2wdbHash })

      if (!order) {
        throw new Error('order not found')
      }

      return order.toObject()
    } catch (err) {
      console.error('Error in findOrder(): ', err)
      throw err
    }
  }

  // This function is called by the garbage collection timer controller. It
  // checks the UTXO associated with each Order in the database. If the UTXO
  // has been spent, the Order is deleted from the database.
  async removeStaleOrders () {
    try {
      const now = new Date()
      console.log(`Starting garbage collection for Orders at ${now.toLocaleString()}`)

      // Get all Orders in the database.
      const orders = await this.OrderModel.find({})
      // console.log('orders: ', orders)

      // Loop through each Order and ensure the UTXO is still valid.
      for (let i = 0; i < orders.length; i++) {
        const thisOrder = orders[i]
        // console.log(`thisOrder: ${JSON.stringify(thisOrder, null, 2)}`)

        // Check if UTXO is still valie
        const result = await this.adapters.wallet.getTxOut(thisOrder.utxoTxid, thisOrder.utxoVout)
        // console.log('result: ', result)

        // null means UTXO has been spent and order is no longer valid.
        if (result === null) {
          console.log('Removing this order that contains an spent UTXO: ', JSON.stringify(thisOrder, null, 2))

          // Delete the model from the database.
          await thisOrder.remove()
        }
      }
    } catch (err) {
      console.error('Error in removeStaleOrders()')
      throw err
    }
  }
}

module.exports = OrderLib
