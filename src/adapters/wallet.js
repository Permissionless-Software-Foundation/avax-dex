/*
  Adapter library for working with a wallet.
*/

// Public npm libraries
const BchWallet = require('minimal-slp-wallet/index')
const AvaxWallet = require('minimal-avax-wallet')

// Local libraries
const JsonFiles = require('./json-files')

const WALLET_FILE = `${__dirname.toString()}/../../wallet.json`
const AVAX_WALLET_FILE = `${__dirname.toString()}/../../wallet-avax.json`
const PROOF_OF_BURN_QTY = 0.01
const P2WDB_TOKEN_ID =
  '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'

class WalletAdapter {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.jsonFiles = new JsonFiles()
    this.WALLET_FILE = WALLET_FILE
    this.AVAX_WALLET_FILE = AVAX_WALLET_FILE
    this.BchWallet = BchWallet
    this.AvaxWallet = AvaxWallet
  }

  // Open the wallet file, or create one if the file doesn't exist.
  async openWallet (isAvax = false) {
    try {
      let walletData
      const walletFile = isAvax ? this.AVAX_WALLET_FILE : this.WALLET_FILE

      // Try to open the wallet.json file.
      try {
        // console.log('walletFile: ', walletFile)
        walletData = await this.jsonFiles.readJSON(walletFile)
      } catch (err) {
        // Create a new wallet file if one does not already exist.
        // console.log('caught: ', err)
        console.warn('Wallet file not found. Creating new file.')

        // Create a new wallet.
        // No-Update flag creates wallet without making any network calls.
        let walletInstance
        if (isAvax) {
          walletInstance = new this.AvaxWallet(undefined, { noUpdate: true })
        } else {
          walletInstance = new this.BchWallet(undefined, { noUpdate: true })
        }

        // Wait for wallet to initialize.
        await walletInstance.walletInfoPromise

        walletData = walletInstance.walletInfo

        // Add the nextAddress property
        walletData.nextAddress = 1

        // Write the wallet data to the JSON file.
        await this.jsonFiles.writeJSON(walletData, walletFile)
      }

      // console.log('walletData: ', walletData)

      return walletData
    } catch (err) {
      console.error('Error in openWallet()')
      throw err
    }
  }

  // Increments the 'nextAddress' property in the wallet file. This property
  // indicates the HD index that should be used to generate a key pair for
  // storing funds for Offers.
  // This function opens the wallet file, increments the nextAddress property,
  // then saves the change to the wallet file.
  async incrementNextAddress (isAvax = false) {
    try {
      let walletFile
      let wallet

      if (isAvax) {
        walletFile = this.AVAX_WALLET_FILE
        wallet = this.avaxWallet
      } else {
        walletFile = this.WALLET_FILE
        wallet = this.bchWallet
      }

      const walletData = await this.openWallet(isAvax)
      // console.log('original walletdata: ', walletData)

      const nextAddress = walletData.nextAddress
      walletData.nextAddress++

      // console.log('walletData finish: ', walletData)
      await this.jsonFiles.writeJSON(walletData, walletFile)

      // Update the working instance of the wallet.
      wallet.walletInfo.nextAddress++
      // console.log('this.bchWallet.walletInfo: ', this.bchWallet.walletInfo)

      return nextAddress
    } catch (err) {
      console.error('Error in incrementNextAddress()')
      throw err
    }
  }

  // Avalanche: This method returns the keypair object to generate
  // a private key, public address, and an address
  async getAvaxKeyPair (hdIndex) {
    try {
      if (hdIndex === undefined || hdIndex === null) {
        hdIndex = await this.incrementNextAddress()
      }

      const mnemonic = this.avaxWallet.walletInfo.mnemonic

      const isValidPhrase = this.avaxWallet.create.bip39.validateMnemonic(mnemonic)

      if (!isValidPhrase) {
        throw Error('invalid mnemonic')
      }

      const seed = this.avaxWallet.create.bip39.mnemonicToSeedSync(mnemonic)
      const masterNode = this.avaxWallet.create.HDKey.fromMasterSeed(seed)
      const accountNode = masterNode.derive(`m/44'/9000'/0'/0/${hdIndex}`)

      const xkeyChain = this.avaxWallet.tokens.xchain.newKeyChain()
      const keypair = xkeyChain.importKey(accountNode.privateKey)

      return keypair
    } catch (error) {
      console.log(`Error on wallet/getAvaxKeyPair(): ${error.message}`)
      throw error
    }
  }

  // This method returns an object that contains a private key WIF, public address,
  // and the index of the HD wallet that the key pair was generated from.
  // TODO: Allow input integer. If input is used, use that as the index. If no
  // input is provided, then call incrementNextAddress().
  async getKeyPair () {
    try {
      const hdIndex = await this.incrementNextAddress()

      const mnemonic = this.bchWallet.walletInfo.mnemonic

      // root seed buffer
      const rootSeed = await this.bchWallet.bchjs.Mnemonic.toSeed(mnemonic)

      const masterHDNode = this.bchWallet.bchjs.HDNode.fromSeed(rootSeed)

      // HDNode of BIP44 account
      // const account = this.bchWallet.bchjs.HDNode.derivePath(masterHDNode, "m/44'/245'/0'")

      const childNode = masterHDNode.derivePath(`m/44'/245'/0'/0/${hdIndex}`)

      const cashAddress = this.bchWallet.bchjs.HDNode.toCashAddress(childNode)
      console.log('cashAddress: ', cashAddress)

      const wif = this.bchWallet.bchjs.HDNode.toWIF(childNode)

      const outObj = {
        cashAddress,
        wif,
        hdIndex
      }

      return outObj
    } catch (err) {
      console.error('Error in getKeyPair()')
      throw err
    }
  }

  // Create an instance of minimal-slp-wallet. Use data in the wallet.json file,
  // and pass the bch-js information to the minimal-slp-wallet library.
  async instanceWallet (walletData, bchjs) {
    try {
      // TODO: Throw error if bch-js is not passed in.
      // TODO: throw error if wallet data is not passed in.

      const advancedConfig = {
        restURL: bchjs.restURL,
        apiToken: bchjs.apiToken
      }

      // Instantiate minimal-slp-wallet.
      this.bchWallet = new this.BchWallet(walletData.mnemonic, advancedConfig)

      // Wait for wallet to initialize.
      await this.bchWallet.walletInfoPromise

      return true
    } catch (err) {
      console.error('Error in instanceWallet()')
      throw err
    }
  }

  // Create an instance of minimal-avax-wallet. Use data in the wallet-avax.json file
  async instanceAvaxWallet (walletData) {
    try {
      if (typeof walletData !== 'object') {
        throw new Error('walletData must be an object with the wallet information')
      }

      // Instantiate minimal-avax-wallet.
      this.avaxWallet = new this.AvaxWallet(walletData.mnemonic)

      // Wait for wallet to initialize.
      await this.avaxWallet.walletInfoPromise

      return true
    } catch (err) {
      console.error('Error in instanceAvaxWallet()')
      throw err
    }
  }

  // Make offfer Tx
  async createPartialTxHex (avaxAmount, privateKey) {
    let tokenWallet = this.avaxWallet

    if (privateKey) {
      tokenWallet = new this.AvaxWallet(privateKey)
      await tokenWallet.walletInfoPromise
    }

    // arrange the inputs
    const addrReferences = {}
    const inputs = []
    const address = tokenWallet.walletInfo.address

    for (const item of tokenWallet.utxos.utxoStore) {
      const utxo = tokenWallet.utxos.encodeUtxo(item, address)
      const utxoID = utxo.getUTXOID()

      addrReferences[utxoID] = address
      inputs.push(utxo)
    }

    // get the desired asset outputs for the transaction
    const avaxOutput = tokenWallet.utxos.formatOutput({
      amount: avaxAmount,
      address: this.avaxWallet.walletInfo.address,
      assetID: tokenWallet.sendAvax.avaxID
    })

    // Build the transcation
    const partialTx = new tokenWallet.utxos.avm.BaseTx(
      tokenWallet.ava.getNetworkID(),
      tokenWallet.bintools.cb58Decode(
        tokenWallet.tokens.xchain.getBlockchainID()
      ),
      [avaxOutput],
      inputs
    )

    const hexString = partialTx.toBuffer().toString('hex')

    return {
      txHex: hexString,
      addrReferences: JSON.stringify(addrReferences)
    }
  }

  // Generate a cryptographic signature, required to write to the P2WDB.
  async generateSignature (message) {
    try {
      // TODO: Add input validation for message.

      const privKey = this.bchWallet.walletInfo.privateKey

      // console.log('privKey: ', privKey)
      // console.log('flags.data: ', flags.data)

      const signature = this.bchWallet.bchjs.BitcoinCash.signMessageWithPrivKey(
        privKey,
        message
      )

      return signature
    } catch (err) {
      console.error('Error in generateSignature()')
      throw err
    }
  }

  // Burn enough PSF to generate a valide proof-of-burn for writing to the P2WDB.
  async burnPsf () {
    try {
      // TODO: Throw error if this.bchWallet has not been instantiated.

      // console.log('walletData: ', walletData)
      // console.log(
      //   `walletData.utxos.utxoStore.slpUtxos: ${JSON.stringify(
      //     walletData.utxos.utxoStore.slpUtxos,
      //     null,
      //     2,
      //   )}`,
      // )

      // Get token UTXOs held by the wallet.
      const tokenUtxos = this.bchWallet.utxos.utxoStore.slpUtxos.type1.tokens

      // Find a token UTXO that contains PSF with a quantity higher than needed
      // to generate a proof-of-burn.
      let tokenUtxo = {}
      for (let i = 0; i < tokenUtxos.length; i++) {
        const thisUtxo = tokenUtxos[i]

        // If token ID matches.
        if (thisUtxo.tokenId === P2WDB_TOKEN_ID) {
          if (parseFloat(thisUtxo.tokenQty) >= PROOF_OF_BURN_QTY) {
            tokenUtxo = thisUtxo
            break
          }
        }
      }

      if (tokenUtxo.tokenId !== P2WDB_TOKEN_ID) {
        throw new Error(
          `Token UTXO of with ID of ${P2WDB_TOKEN_ID} and quantity greater than ${PROOF_OF_BURN_QTY} could not be found in wallet.`
        )
      }

      const result = await this.bchWallet.burnTokens(
        PROOF_OF_BURN_QTY,
        P2WDB_TOKEN_ID
      )
      // console.log('walletData.burnTokens() result: ', result)

      return result

      // return {
      //   success: true,
      //   txid: 'fakeTxid',
      // }
    } catch (err) {
      console.error('Error in burnPsf(): ', err)
      throw err
    }
  }
}

module.exports = WalletAdapter
