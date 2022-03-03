const { wlogger } = require('../adapters/wlogger')

const OfferEntity = require('../entities/offer')

class OfferLib {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Offer Use Cases library.'
      )
    }

    // Encapsulate dependencies
    this.offerEntity = new OfferEntity()
    this.OfferModel = this.adapters.localdb.Offer
    this.bch = this.adapters.bch
  }

  // Create a new offer model and add it to the Mongo database.
  async createOffer (entryObj) {
    try {
      console.log(
        `createOffer() entryObj: ${JSON.stringify(entryObj, null, 2)}`
      )

      // Input Validation
      const offerEntity = this.offerEntity.validate(entryObj)

      const isForSale = offerEntity.buyOrSell.includes('sell')
      offerEntity.tokenInSats = await this.adapters.wallet.getAmountInSats(
        offerEntity.tokenId,
        offerEntity.numTokens
      )
      // Initially tokens are given and avax will be taken in return
      let offered = { amount: offerEntity.tokenInSats, assetID: offerEntity.tokenId }
      let ordered = { amount: offerEntity.rateInSats, assetID: this.adapters.wallet.avaxWallet.sendAvax.avaxID }

      // Swap them in buy as avax is given and token will be taken in return
      if (!isForSale) {
        [offered, ordered] = [ordered, offered]
      }

      // Ensure sufficient AVAX tokens exist to create the offer.
      await this.ensureFunds(offered, isForSale)

      // Ensure BCH wallet has finished initializing
      await this.adapters.wallet.bchWallet.walletInfoPromise

      // Ensure sufficient funds in the BCH wallet to make a P2WDB write.
      await this.adapters.p2wdb.checkForSufficientFunds(
        this.adapters.wallet.bchWallet.walletInfo.privateKey
      )

      // Move the tokens to holding address.
      const addressInfo = await this.getAddress()
      const utxoInfo = await this.moveTokens(offered, addressInfo, isForSale)
      console.log('utxoInfo: ', utxoInfo)

      // create partial tx with the token inputs and avax output
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(3000)
      const partialTx = await this.adapters.wallet.createPartialTxHex(
        ordered,
        addressInfo.privateKey
      )

      // Update the offer with the new UTXO information and the partialTx information.
      offerEntity.utxoTxid = utxoInfo.txid
      offerEntity.utxoVout = utxoInfo.vout
      offerEntity.txHex = partialTx.txHex
      offerEntity.addrReferences = partialTx.addrReferences
      offerEntity.hdIndex = addressInfo.hdIndex

      // Add offer to P2WDB.
      const hash = await this.adapters.p2wdb.write({
        wif: this.adapters.wallet.bchWallet.walletInfo.privateKey,
        data: offerEntity,
        appId: 'swapTest555'
      })

      offerEntity.p2wdbHash = hash
      const offerEntry = new this.OfferModel(offerEntity)
      await offerEntry.save()
      // console.log('hash: ', hash)

      // Update the UTXO store in both wallets.
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(3000)
      await Promise.all([
        this.adapters.wallet.avaxWallet.getUtxos(),
        this.adapters.wallet.bchWallet.getUtxos()
      ])

      return hash
    } catch (err) {
      wlogger.error('Error in use-cases/createOffer())')
      console.log(err)
      throw err
    }
  }

  // Move the tokens indicated in the offer to a temporary holding address.
  // This will generate the UTXO used in the Signal message. This function
  // moves the funds and returns the UTXO information.
  async moveTokens (offered, addressInfo, isForSale) {
    try {
      console.log('addressInfo: ', addressInfo)
      const assetID = offered.assetID
      let amount = offered.amount

      if (!isForSale) {
        const txFee = this.adapters.wallet.avaxWallet.tokens.xchain.getTxFee()
        amount = txFee.addn(offered.amount).toNumber()
      }

      const receiver = {
        address: addressInfo.address,
        amount,
        assetID
      }

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
  async ensureFunds (offered, isForSale) {
    try {
      let { amount, assetID } = offered

      // Calculate spendings taking into account fees
      if (!isForSale) {
        const txFee = this.adapters.wallet.avaxWallet.tokens.xchain.getTxFee()
        amount = txFee.muln(2).addn(amount).toNumber()
      }

      // Get Assets.
      const assets = this.adapters.wallet.avaxWallet.utxos.assets
      const asset = assets.find(item => item.assetID === assetID)

      if (!asset || asset.amount < amount) {
        throw new Error(
          'App wallet does not have enough tokens to satisfy the offer.'
        )
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
      console.log(`Error on offer/getAddress(): ${error.message}`)
      throw error
    }
  }

  async listOffers () {
    try {
      return this.OfferModel.find()
    } catch (error) {
      console.log(`Error on offer/listOffers(): ${error.message}`)
      throw error
    }
  }

  async findOfferByHash (p2wdbHash) {
    try {
      if (typeof p2wdbHash !== 'string' || !p2wdbHash) {
        throw new Error('p2wdbHash must be a string')
      }

      const offer = await this.OfferModel.findOne({ p2wdbHash })

      if (!offer) {
        throw new Error('offer not found')
      }

      return offer.toObject()
    } catch (err) {
      console.error('Error in findOffer(): ', err)
      throw err
    }
  }
}

module.exports = OfferLib
