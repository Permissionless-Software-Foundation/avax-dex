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

  /**
   * TODO:
   * - Move new address generation to the create offer method, so I can keep track of the address it was sent to
   * - offer entity, add address
   * - Follow the steps used in generate offer to make a partial transaction with the information held in the newly created address
   * - save the hex info into the p2wdb
   */

  // Create a new offer model and add it to the Mongo database.
  async createOffer (entryObj) {
    try {
      // Input Validation
      const offerEntity = this.offerEntity.validate(entryObj)

      // Ensure sufficient tokens exist to create the offer.
      await this.ensureFunds(offerEntity)

      // Move the tokens to holding address.
      const addressInfo = await this.getAddress()
      const utxoInfo = await this.moveTokens(offerEntity, addressInfo)
      console.log('utxoInfo: ', utxoInfo)

      // Update the UTXO store for the wallet.
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(3000)
      await this.adapters.wallet.avaxWallet.getUtxos()

      // Update the offer with the new UTXO information.
      offerEntity.utxoTxid = utxoInfo.txid
      offerEntity.utxoVout = utxoInfo.outputIdx

      // Burn PSF token to pay for P2WDB write.
      const txid = await this.adapters.wallet.burnPsf()
      console.log('burn txid: ', txid)
      console.log(`https://simpleledger.info/tx/${txid}`)

      // generate signature.
      const now = new Date()
      const message = now.toISOString()
      const signature = await this.adapters.wallet.generateSignature(message)
      // console.log('signature: ', signature)

      // create partial tx with the token inputs and avax output
      const partialTx = await this.adapters.wallet.createPartialTxHex(
        offerEntity.rateInSats,
        addressInfo.privateKey
      )

      // Update the offer with the new partialTx information.
      offerEntity.txHex = partialTx.txHex
      offerEntity.addrReferences = partialTx.addrReferences
      offerEntity.hdIndex = addressInfo.hdIndex

      const p2wdbObj = {
        txid,
        signature,
        message,
        appId: 'swapTest555',
        data: offerEntity
      }

      // Add offer to P2WDB.
      const hash = await this.adapters.p2wdb.write(p2wdbObj)
      // console.log('hash: ', hash)

      return hash
    } catch (err) {
      // console.log("Error in use-cases/entry.js/createEntry()", err.message)
      wlogger.error('Error in use-cases/entry.js/createOffer())')
      throw err
    }
  }

  // Move the tokens indicated in the offer to a temporary holding address.
  // This will generate the UTXO used in the Signal message. This function
  // moves the funds and returns the UTXO information.
  async moveTokens (offerEntity, addressInfo) {
    try {
      console.log('addressInfo: ', addressInfo)

      const receiver = {
        address: addressInfo.address,
        amount: offerEntity.numTokens,
        assetID: offerEntity.tokenId
      }

      const txid = await this.adapters.wallet.avaxWallet.send([receiver])

      const utxoInfo = {
        txid,
        vout: '00000000' // equivalent to vout 0
      }

      return utxoInfo
    } catch (err) {
      console.error('Error in moveTokens(): ', err)
      throw err
    }
  }

  // Ensure that the wallet has enough BCH and tokens to complete the requested
  // trade.
  async ensureFunds (offerEntity) {
    try {
      // Get UTXOs.
      const utxos = this.adapters.wallet.avaxWallet.utxos.assets
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (offerEntity.buyOrSell.includes('sell')) {
        // Sell Offer
        const asset = utxos.find(item => item.assetID === offerEntity.tokenId)

        // If there are fewer tokens in the wallet than what's in the offer,
        // throw an error.
        if (!asset || asset.amount < offerEntity.numTokens) {
          throw new Error('App wallet does not have enough tokens to satisfy the SELL offer.')
        }
      } else {
        // Buy Offer
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
        hdIndex
      }
    } catch (error) {
      console.log(`Error on offer/getAddress(): ${error.message}`)
      throw error
    }
  }
}

module.exports = OfferLib
