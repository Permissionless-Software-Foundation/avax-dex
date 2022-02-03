/*
  Adapter library for working with a wallet.
*/

// Public npm libraries
const BchWallet = require('minimal-slp-wallet/index')
const AvaxWallet = require('minimal-avax-wallet')
const createHash = require('create-hash')
const { Signature } = require('avalanche/dist/common/credentials')

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

    this.createHash = createHash
    this.Signature = Signature
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
        hdIndex = await this.incrementNextAddress(true)
      }

      const mnemonic = this.avaxWallet.walletInfo.mnemonic

      const isValidPhrase = this.avaxWallet.create.bip39.validateMnemonic(
        mnemonic
      )

      if (!isValidPhrase) {
        throw Error('invalid mnemonic')
      }

      const seed = this.avaxWallet.create.bip39.mnemonicToSeedSync(mnemonic)
      const masterNode = this.avaxWallet.create.HDKey.fromMasterSeed(seed)
      const accountNode = masterNode.derive(`m/44'/9000'/0'/0/${hdIndex}`)

      const xkeyChain = this.avaxWallet.tokens.xchain.newKeyChain()
      const keypair = xkeyChain.importKey(accountNode.privateKey)
      // add index to keep track of it
      keypair.hdIndex = hdIndex

      return keypair
    } catch (error) {
      console.log(`Error on wallet/getAvaxKeyPair(): ${error.message}`)
      throw error
    }
  }

  // BCH-specific.
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

  // BCH-specific
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
        throw new Error(
          'walletData must be an object with the wallet information'
        )
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

  // Make offer Tx
  async createPartialTxHex (avaxAmount, privateKey) {
    try {
      let tokenWallet = this.avaxWallet

      if (privateKey) {
        tokenWallet = new this.AvaxWallet(privateKey)
        await tokenWallet.walletInfoPromise
        // await tokenWallet.getUtxos()
      }

      // take just the first utxo as input, since it's a single utxo address
      const addrReferences = {}
      const address = tokenWallet.walletInfo.address

      const [tokenUtxo] = tokenWallet.utxos.utxoStore
      const tokenInput = tokenWallet.utxos.encodeUtxo(tokenUtxo, address)
      const inputs = [tokenInput]
      const utxoID = tokenInput.getUTXOID()
      addrReferences[utxoID] = address

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
    } catch (error) {
      console.log('error wallet.json/createPartialTxHex():')
      throw error
    }
  }

  async takePartialTxHex (txHex, addrReferences) {
    try {
      const walletData = this.avaxWallet
      const avaxIdString = walletData.sendAvax.avaxID
      const avaxID = walletData.bintools.cb58Decode(
        avaxIdString
      )

      const asset = walletData.utxos.assets.find(
        (item) => item.assetID === avaxIdString
      )

      if (!asset) {
        throw new Error(
          "Insufficient funds. You are trying to send AVAX, but the wallet doesn't have any"
        )
      }

      // Parse the old transaction
      console.log(`txHex: ${txHex}`)
      const baseTx = new walletData.utxos.avm.BaseTx()
      const txBuffer = Buffer.from(txHex, 'hex')
      baseTx.fromBuffer(txBuffer)

      const outputs = baseTx.getOuts()
      const avaxOut = outputs.find((item) => {
        return item.getAssetID().toString('hex') === avaxID.toString('hex')
      })

      const fee = walletData.tokens.xchain.getTxFee()
      const avaxRequired = avaxOut.getOutput().getAmount().add(fee)
      const avaxUtxo = this.selectUTXO(
        avaxRequired.toNumber(),
        walletData.utxos.utxoStore
      )

      if (!avaxUtxo.amount) {
        throw new Error('Not enough avax in the selected address')
      }

      const address = walletData.walletInfo.address
      const avaxInput = walletData.utxos.encodeUtxo(avaxUtxo, address)
      const utxoID = avaxInput.getUTXOID()
      addrReferences[utxoID] = address

      const inputs = baseTx.getIns()
      const [tokenInput] = inputs
      const assetID = tokenInput.getAssetID()

      const tokenRemainderOut = outputs.find((item) => {
        return item.getAssetID().toString('hex') !== avaxID.toString('hex')
      })
      let tokenRemainder = new walletData.BN(0)
      let tokenAmount = new walletData.BN(0)
      if (tokenRemainderOut) {
        tokenRemainder = tokenRemainderOut.getOutput().getAmount()
      }

      for (const input of inputs) {
        if (input.getAssetID().toString('hex') !== assetID.toString('hex')) {
          continue
        }

        tokenAmount = tokenAmount.add(input.getInput().getAmount())
      }
      tokenAmount = tokenAmount.sub(tokenRemainder)

      const tokenOutput = walletData.utxos.formatOutput({
        amount: tokenAmount.toNumber(),
        address,
        assetID: walletData.bintools.cb58Encode(assetID)
      })

      inputs.push(avaxInput)
      outputs.push(tokenOutput)

      const remainder = new walletData.BN(avaxUtxo.amount).sub(avaxRequired)
      if (remainder.gt(new walletData.BN(0))) {
        const remainderOut = walletData.utxos.formatOutput({
          amount: remainder,
          address,
          assetID: avaxIdString
        })

        outputs.push(remainderOut)
      }

      const partialTx = new walletData.utxos.avm.BaseTx(
        walletData.ava.getNetworkID(),
        walletData.bintools.cb58Decode(
          walletData.tokens.xchain.getBlockchainID()
        ),
        outputs,
        inputs
      )

      const keyChain = walletData.tokens.xchain.keyChain()
      keyChain.importKey(walletData.walletInfo.privateKey)

      const unsigned = new walletData.utxos.avm.UnsignedTx(partialTx)

      const signed = this.partialySignTx(
        walletData,
        unsigned,
        keyChain,
        addrReferences
      )
      const hexString = signed.toBuffer().toString('hex')

      return {
        txHex: hexString,
        addrReferences: JSON.stringify(addrReferences)
      }
    } catch (err) {
      console.log('Error in wallet.json/takePartialTxHex()', err)
      throw err
    }
  }

  async completeTxHex (txHex, addrReferences, hdIndex) {
    try {
      const keyPair = await this.getAvaxKeyPair(hdIndex)
      const walletData = new AvaxWallet(keyPair.getPrivateKeyString(), { noUpdate: true })

      // Parse the partially signed transaction
      const halfSignedTx = new walletData.utxos.avm.Tx()
      const txBuffer = Buffer.from(txHex, 'hex')
      halfSignedTx.fromBuffer(txBuffer)

      const credentials = halfSignedTx.getCredentials()
      const partialTx = halfSignedTx.getUnsignedTx()

      // Sign Alice's input.
      const keyChain = walletData.tokens.xchain.keyChain()
      keyChain.addKey(keyPair)

      const signed = this.partialySignTx(
        walletData,
        partialTx,
        keyChain,
        addrReferences,
        credentials
      )

      // Check that the transaction is fully-signed.
      const newCredentials = signed.getCredentials()
      const hasAllSignatures = newCredentials.every((cred) =>
        Boolean(cred.sigArray.length)
      )

      if (!hasAllSignatures) {
        throw new Error('The transaction is not fully signed')
      }

      // const signedHex = signed.toString()
      // Broadcast the transaction.
      // const txid = await walletData.sendAvax.ar.issueTx(signedHex)

      return { txid: 'some txid' }
    } catch (err) {
      console.log('Error in wallet.json/completeTxHex()', err)
      throw err
    }
  }

  /**  This method assumes that all the utxos have only one associated address */
  partialySignTx (walletData, tx, keychain, reference, oldCredentials = []) {
    const avm = walletData.utxos.avm

    const txBuffer = tx.toBuffer()
    const msg = Buffer.from(this.createHash('sha256').update(txBuffer).digest())
    const credentials = [...oldCredentials]

    const inputs = tx.getTransaction().getIns()
    console.log(' ')
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const cred = avm.SelectCredentialClass(
        input.getInput().getCredentialID()
      )

      const inputid = input.getUTXOID()
      try {
        const source = walletData.tokens.xchain.parseAddress(reference[inputid])
        const keypair = keychain.getKey(source)
        const signval = keypair.sign(msg)
        const sig = new this.Signature()
        sig.fromBuffer(signval)
        cred.addSignature(sig)

        console.log(
          `input ${i}: Successfully signed, ( ${inputid} signed with ${reference[inputid]} )`
        )
        credentials[i] = cred
      } catch (error) {
        console.log(
          `input ${i}: Skipping, address is not in the keychain, ( ${inputid} )`
        )

        if (!credentials[i]) {
          credentials[i] = cred
        }
      }
    }
    console.log(' ')
    return new avm.Tx(tx, credentials)
  }

  selectUTXO (amount, utxos) {
    let candidateUTXO = {}

    const total = amount
    if (!utxos) {
      utxos = []
    }
    for (let i = 0; i < utxos.length; i++) {
      const thisUTXO = utxos[i]

      console.log(total, thisUTXO.amount)
      if (thisUTXO.amount < total) {
        continue
      }

      if (!candidateUTXO.amount) {
        candidateUTXO = thisUTXO
        continue
      }

      if (candidateUTXO.amount > thisUTXO.amount) {
        candidateUTXO = thisUTXO
      }
    }

    return candidateUTXO
  }

  // BCH specific
  // TODO: This can be removed in favor of using the p2wdb npm library?
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

  // BCH specific
  // TODO: This can be removed in favor of using the p2wdb npm library?
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

  // Fetch a transcation data and return it as an avm.Tx object.
  async getTransaction (txid) {
    try {
      if (typeof txid !== 'string' || !txid) {
        throw new Error('txid must be a valid b58 string')
      }

      const avalance = this.avaxWallet.ava
      const avm = this.avaxWallet.utxos.avm
      new avm.UTXOSet().add()
      const xchain = avalance.XChain()

      // fetch the transaction info
      const txString = await xchain.getTx(txid)
      const tx = new avm.Tx()
      tx.fromString(txString)

      return tx
    } catch (error) {
      console.error('Error in getTransaction()')
      throw error
    }
  }

  async validateIntegrity (offerHex, orderHex) {
    const walletData = this.avaxWallet

    const offerTx = new walletData.utxos.avm.BaseTx()
    const offerBuffer = Buffer.from(offerHex, 'hex')
    offerTx.fromBuffer(offerBuffer)

    const orderTx = new walletData.utxos.avm.Tx()
    const orderBuffer = Buffer.from(orderHex, 'hex')
    orderTx.fromBuffer(orderBuffer)

    const offerInputs = offerTx.getIns()
    const orderInputs = orderTx.getUnsignedTx().getTransaction().getIns()

    // ensure the inputs given in the initial offer are present in the order
    for (const input of offerInputs) {
      const utxoid = input.getUTXOID()
      const included = orderInputs.find(utxo => utxo.getUTXOID() === input.getUTXOID())

      if (!included) {
        return {
          valid: false,
          message: `UTXO ${utxoid} is not present in the order`
        }
      }
    }

    const offerOutputs = offerTx.getOuts()
    const orderOutputs = orderTx.getUnsignedTx().getTransaction().getOuts()
    // ensure the outputs stated in the initial offer are present in the order
    for (const output of offerOutputs) {
      const { asset, amount, addresses } = this.decodeOutput(output)
      const included = orderOutputs.find(item => {
        const orderOut = this.decodeOutput(item)

        return asset === orderOut.asset &&
          amount === orderOut.amount &&
          JSON.stringify(addresses) === JSON.stringify(orderOut.addresses)
      })

      if (!included) {
        return {
          valid: false,
          message: `Missing output with asset '${asset}' to addresses '${addresses}' and amount ${amount}`
        }
      }
    }

    return { valid: true }
  }

  decodeOutput (output) {
    const formated = {}
    formated.asset = this.avaxWallet.bintools.cb58Encode(output.getAssetID())
    formated.amount = output
      .getOutput()
      .getAmount()
      .toNumber()
    formated.addresses = output
      .getOutput()
      .getAddresses()
      .map(this.avaxWallet.ava.XChain().addressFromBuffer)
    return formated
  }

  // returns the output that matches the critetia
  // Expects:
  //   txid: '23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa49732uJK',
  //   criteria: {
  //     address: 'X-avax1',
  //     amount: 1000,
  //     assetID: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si'
  //   }
  async findTxOut (txid, criteria = {}) {
    try {
      const tx = await this.getTransaction(txid)
      const xchain = this.avaxWallet.ava.XChain()
      const bintools = this.avaxWallet.bintools

      const basetx = tx.getUnsignedTx().getTransaction()
      const outs = basetx.getOuts()

      let utxo
      let vout

      for (let i = 0; i < outs.length; i++) {
        const txOut = outs[i]
        const thisOut = txOut.getOutput()

        const addresses = thisOut.getAddresses().map(xchain.addressFromBuffer)

        if (criteria.address && !addresses.includes(criteria.address)) {
          continue
        }

        const amount = thisOut.getAmount().toNumber()
        if (criteria.amount && amount !== criteria.amount) {
          continue
        }

        const assetID = bintools.cb58Encode(txOut.getAssetID())
        if (criteria.assetID && assetID !== criteria.assetID) {
          continue
        }

        utxo = txOut
        vout = i
      }

      if (!utxo) {
        return null
      }

      return { utxo, vout }
    } catch (error) {
      console.error('Error in findTxOut(): ', error)
      throw error
    }
  }

  // Checks if the given output of a trasaction has been already consumed by the receiver
  async getTxOut (txid, vout) {
    try {
      const tx = await this.getTransaction(txid)
      const bintools = this.avaxWallet.bintools
      const xchain = this.avaxWallet.ava.XChain()

      const basetx = tx.getUnsignedTx().getTransaction()
      const outs = basetx.getOuts()

      // identify the output
      const offerOut = outs[vout]
      const address = xchain.addressFromBuffer(
        offerOut.getOutput().getAddress(0)
      )

      const txidBuffer = bintools.cb58Decode(txid)
      const voutHex = `${vout}`.padStart(8, '0')
      const voutBuffer = Buffer.from(voutHex, 'hex')
      const utxoid = bintools.bufferToB58(
        Buffer.concat([txidBuffer, voutBuffer])
      )

      // check if the receiver still holds the utxo
      const { utxos: utxosSet } = await xchain.getUTXOs(address)
      const utxo = utxosSet.getUTXO(utxoid)

      if (!utxo) {
        return null
      }

      const formated = {}
      formated.asset = bintools.cb58Encode(offerOut.getAssetID())
      formated.amount = offerOut
        .getOutput()
        .getAmount()
        .toNumber()
      formated.address = address
      formated.status = 'unspent'
      return formated
    } catch (error) {
      console.error('Error in getTxOutStatus(): ', error)
      throw error
    }
  }
}

module.exports = WalletAdapter
