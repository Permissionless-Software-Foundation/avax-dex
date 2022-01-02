/*
  Unit tests for the Wallet Adapter library.
*/

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs')
// const BCHJS = require('@psf/bch-js')

// Local libraries.
const WalletAdapter = require('../../../src/adapters/wallet')
const {
  MockBchWallet,
  AvalancheWallet,
  txString,
  emptyUTXOSet,
  assetUTXOSet
} = require('../mocks/adapters/wallet')

// Global constants
const testWalletFile = `${__dirname.toString()}/test-wallet.json`
const testAvaxWalletFile = `${__dirname.toString()}/test-avax-wallet.json`

describe('#wallet', () => {
  let uut
  /** @type {sinon.SinonSandbox} */
  let sandbox

  before(() => {
    // Delete the test file if it exists.
    deleteFiles([testWalletFile, testAvaxWalletFile])
  })

  beforeEach(() => {
    uut = new WalletAdapter()
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  after(() => {
    // Delete the test file if it exists.
    deleteFiles([testWalletFile, testAvaxWalletFile])
  })

  describe('#openWallet', () => {
    it('should create a new wallet if file does not exist', async () => {
      // Mock dependencies
      uut.BchWallet = MockBchWallet
      const writeJsonFunction = sandbox.spy(uut.jsonFiles, 'writeJSON')

      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile

      const result = await uut.openWallet()
      // console.log('result: ', result)

      assert.property(result, 'mnemonic')
      assert.property(result, 'privateKey')
      assert.property(result, 'publicKey')
      assert.property(result, 'cashAddress')
      assert.property(result, 'address')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
      assert.property(result, 'hdPath')
      assert.isTrue(writeJsonFunction.calledOnce)

      const args = writeJsonFunction.args[0]
      assert.equal(args[1], testWalletFile)
    })

    it('should create a new avax wallet if file does not exist', async () => {
      // Mock dependencies
      uut.BchWallet = AvalancheWallet
      const writeJsonFunction = sandbox.spy(uut.jsonFiles, 'writeJSON')

      // Ensure we open the test file, not the production wallet file.
      uut.AVAX_WALLET_FILE = testAvaxWalletFile

      const result = await uut.openWallet(true)
      // console.log('result: ', result)

      assert.property(result, 'type')
      assert.property(result, 'mnemonic')
      assert.property(result, 'address')
      assert.property(result, 'privateKey')
      assert.property(result, 'publicKey')
      assert.property(result, 'avax')
      assert.isTrue(writeJsonFunction.calledOnce)

      const args = writeJsonFunction.args[0]
      assert.equal(args[1], testAvaxWalletFile)
    })

    it('should open existing wallet file', async () => {
      // This test case uses the file created in the previous test case.

      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile

      const result = await uut.openWallet()
      // console.log('result: ', result)

      assert.property(result, 'mnemonic')
      assert.property(result, 'privateKey')
      assert.property(result, 'publicKey')
      assert.property(result, 'cashAddress')
      assert.property(result, 'address')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
      assert.property(result, 'hdPath')
    })

    it('should open existing avax wallet file', async () => {
      // This test case uses the file created in the previous test case.

      // Ensure we open the test file, not the production wallet file.
      uut.AVAX_WALLET_FILE = testAvaxWalletFile

      const result = await uut.openWallet(true)
      // console.log('result: ', result)

      assert.property(result, 'type')
      assert.property(result, 'mnemonic')
      assert.property(result, 'address')
      assert.property(result, 'privateKey')
      assert.property(result, 'publicKey')
      assert.property(result, 'avax')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        uut.WALLET_FILE = ''
        uut.BchWallet = () => { }

        await uut.openWallet()
        // console.log('result: ', result)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'this.BchWallet is not a constructor')
      }
    })
  })

  describe('#instanceWallet', () => {
    it('should create an instance of BchWallet', async () => {
      // Mock dependencies
      uut.BchWallet = MockBchWallet

      const bchjs = {
        restURL: 'dummyUrl',
        apiToken: 'dummyToken'
      }

      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile

      const walletData = await uut.openWallet()

      const result = await uut.instanceWallet(walletData.mnemonic, bchjs)

      assert.equal(result, true)
    })

    it('should catch and throw an error', async () => {
      try {
        await uut.instanceWallet()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Cannot read property')
      }
    })
  })

  describe('#instanceAvaxWallet', () => {
    it('should create an instance of AvaxWallet', async () => {
      // Mock dependencies
      uut.AvaxWallet = AvalancheWallet

      // Ensure we open the test file, not the production wallet file.
      uut.AVAX_WALLET_FILE = testAvaxWalletFile

      const walletData = await uut.openWallet(true)

      const result = await uut.instanceAvaxWallet(walletData)

      assert.equal(result, true)
    })

    it('should catch and throw an error', async () => {
      try {
        await uut.instanceAvaxWallet()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'walletData must be an object with the wallet information')
      }
    })
  })

  describe('#generateSignature', () => {
    it('should return a signature', async () => {
      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()

      const result = await uut.generateSignature('test')
      // console.log('result: ', result)

      assert.isString(result)
    })

    it('should catch and throw errors', async () => {
      try {
        // mock instance of minimal-slp-wallet
        uut.bchWallet = new MockBchWallet()

        // force an error
        sandbox
          .stub(uut.bchWallet.bchjs.BitcoinCash, 'signMessageWithPrivKey')
          .throws(new Error('test error'))

        await uut.generateSignature('test')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#burnPsf', () => {
    it('should burn PSF tokens and return the txid', async () => {
      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()

      const result = await uut.burnPsf()
      // console.log('result: ', result)

      assert.equal(result.success, true)
      assert.equal(result.txid, 'txid')
    })

    it('should throw error if no PSF tokens are found', async () => {
      try {
        // mock instance of minimal-slp-wallet
        uut.bchWallet = new MockBchWallet()

        // Remove the PSF token from the mock data.
        uut.bchWallet.utxos.utxoStore.slpUtxos.type1.tokens.pop()

        await uut.burnPsf()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Token UTXO of with ID of')
      }
    })

    it('should catch and throw an error', async () => {
      try {
        await uut.burnPsf()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read property')
      }
    })
  })

  describe('#incrementNextAddress', () => {
    it('should increment the nextAddress property', async () => {
      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile

      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()

      const result = await uut.incrementNextAddress()

      assert.equal(result, 1)
    })

    it('should increment the nextAddress property in the avax wallet', async () => {
      // Ensure we open the test file, not the production wallet file.
      uut.AVAX_WALLET_FILE = testAvaxWalletFile

      // mock instance of minimal-slp-wallet
      uut.avaxWallet = new AvalancheWallet()

      const result = await uut.incrementNextAddress(true)

      assert.equal(result, 1)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'openWallet').rejects(new Error('test error'))

        await uut.incrementNextAddress()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getKeyPair', () => {
    it('should return an object with a key pair', async () => {
      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile

      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()

      const result = await uut.getKeyPair()
      // console.log('result: ', result)

      assert.property(result, 'cashAddress')
      assert.property(result, 'wif')
      assert.property(result, 'hdIndex')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut, 'incrementNextAddress')
          .rejects(new Error('test error'))

        await uut.getKeyPair()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getAvaxKeyPair', () => {
    it('should return a key pair object', async () => {
      // mock instance of minimal-avax-wallet
      uut.avaxWallet = new AvalancheWallet()

      const result = await uut.getAvaxKeyPair(0)

      assert.equal(uut.avaxWallet.walletInfo.address, result.getAddressString())
      assert.equal(
        uut.avaxWallet.walletInfo.privateKey,
        result.getPrivateKeyString()
      )
      assert.equal(
        uut.avaxWallet.walletInfo.publicKey,
        result.getPublicKeyString()
      )
    })

    it('should return a different key pair object', async () => {
      // mock instance of minimal-avax-wallet
      uut.avaxWallet = new AvalancheWallet()

      sandbox.stub(uut, 'incrementNextAddress').resolves(1)

      const result = await uut.getAvaxKeyPair()

      assert.equal(
        result.getAddressString(),
        'X-avax1mp0rpa4zp350hdf4g868yejp0879zkgndd542l'
      )
      assert.equal(
        result.getPrivateKeyString(),
        'PrivateKey-XYcZQEkeJCXySv1gyvgPkbZWTpdPDhfXYYVNhcV4FEhU2MBvA'
      )
      assert.equal(
        result.getPublicKeyString(),
        '6svEhF9Ci7NGU9TcdbZ9Kpy4UjdfvWenN8AGmSPBrgZXeWodbj'
      )
    })

    it('should catch and throw an error', async () => {
      try {
        // mock instance of minimal-avax-wallet
        uut.avaxWallet = new AvalancheWallet()
        uut.avaxWallet.walletInfo.mnemonic = ''

        await uut.getAvaxKeyPair(0)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'invalid mnemonic')
      }
    })
  })

  describe('#createPartialTxHex', () => {
    it('should return a partial transaction with a different address', async () => {
      // mock instance of minimal-avax-wallet
      uut.avaxWallet = new AvalancheWallet()

      const result = await uut.createPartialTxHex(10000, uut.avaxWallet.walletInfo.privateKey)

      assert.hasAllKeys(result, ['txHex', 'addrReferences'])
      assert.equal(
        result.txHex,
        '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0' +
        '000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000' +
        '000070000000000002710000000000000000000000001000000012a911a32b2dcfa390b020' +
        'b406131df356b84a2a100000001db20a53856ff6c6a1ea2721ac5c007698f9e5dba157a3f1' +
        '4aac0a26521f112a200000002f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea2' +
        '85fefa5a86f5e16000000050000000000013043000000010000000000000000'
      )
      assert.equal(result.addrReferences, '{"2fWKUBaTWfrbs5uHJvnFzyLsBg3b7yNkWHFYWrdGJYHCRwa3ww":"X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd"}')
    })

    it('should handle an throw error', async () => {
      // mock instance of minimal-avax-wallet
      uut.avaxWallet = new AvalancheWallet()
      uut.avaxWallet.utxos.utxoStore = []
      try {
        await uut.createPartialTxHex(10000)
        assert.fail('unexpected result')
      } catch (err) {
        assert.include(err.message, 'Cannot read property')
      }
    })

    it('should return a partial transaction as hex string and the address reference', async () => {
      // mock instance of minimal-avax-wallet
      uut.avaxWallet = new AvalancheWallet()

      const result = await uut.createPartialTxHex(10000)

      assert.hasAllKeys(result, ['txHex', 'addrReferences'])
      assert.equal(
        result.txHex,
        '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b000' +
        '0000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000' +
        '70000000000002710000000000000000000000001000000012a911a32b2dcfa390b020b40613' +
        '1df356b84a2a1000000010552889bec3957677061bae1c8a57966895fce73bd3e2c66efd53d9' +
        '81b9b5fa000000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d5' +
        '7c645000000050000000000000001000000010000000000000000'
      )
      assert.equal(result.addrReferences, '{"3LxJXtS6FYkSpcRLPu1EeGZDdFBY41J4YxH1Nwohxs2cj8svY":"X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd"}')
    })
  })

  describe('#getTransaction', () => {
    it('should return a avm.Tx item', async () => {
      uut.avaxWallet = new AvalancheWallet()
      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getTx').resolves(txString)

      const result = await uut.getTransaction('txid')

      assert.equal(result.getTypeName(), 'Tx')
    })

    it('should throw an error if the txid is not provided', async () => {
      try {
        await uut.getTransaction()
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'txid must be a valid b58 string')
      }
    })
  })

  describe('#getTxOut', () => {
    it('should return "unspend" if the utxo hasnt been spent', async () => {
      uut.avaxWallet = new AvalancheWallet()

      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getTx').resolves(txString)
      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getUTXOs').resolves({ utxos: assetUTXOSet })

      const result = await uut.getTxOut('23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa49732uJK', 1)
      assert.hasAllKeys(result, ['asset', 'amount', 'address', 'status'])
    })

    it('should return null if the utxo was spent', async () => {
      uut.avaxWallet = new AvalancheWallet()

      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getTx').resolves(txString)
      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getUTXOs').resolves({ utxos: emptyUTXOSet })

      const result = await uut.getTxOut('23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa49732uJK', 1)

      assert.isTrue(!result)
    })

    it('should throw an error and catch an error', async () => {
      try {
        await uut.getTxOut()
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'txid must be a valid b58 string')
      }
    })
  })

  describe('#findTxOut', () => {
    it('should return the utxo and the vout if any matches the criteria', async () => {
      uut.avaxWallet = new AvalancheWallet()

      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getTx').resolves(txString)
      const result = await uut.findTxOut('txid', {
        address: 'X-avax1rjhc87za0j996nh6lxvgw4w72rp42jl67t7mln',
        amount: 500,
        assetID: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si'
      })

      assert.hasAllKeys(result, ['utxo', 'vout'])
      assert.equal(result.vout, 2)
      assert.equal(result.utxo.getTypeName(), 'TransferableOutput')
    })

    it('should return null if there is not an output that matches the criteria', async () => {
      uut.avaxWallet = new AvalancheWallet()

      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getTx').resolves(txString)
      const result = await uut.findTxOut('txid', {
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5'
      })

      assert.equal(result, null)
    })

    it('should return the last utxo if the criteria is an empty object', async () => {
      uut.avaxWallet = new AvalancheWallet()

      sandbox.stub(uut.avaxWallet.ava.XChain(), 'getTx').resolves(txString)
      const result = await uut.findTxOut('txid')

      assert.hasAllKeys(result, ['utxo', 'vout'])
      assert.equal(result.vout, 2)
      assert.equal(result.utxo.getTypeName(), 'TransferableOutput')
    })

    it('should throw an error and catch an error', async () => {
      try {
        await uut.findTxOut()
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'txid must be a valid b58 string')
      }
    })
  })
})

const deleteFiles = (filepaths) => {
  for (const path of filepaths) {
    try {
      // Delete state if exist
      fs.unlinkSync(path)
    } catch (err) {
      // console.error('Error trying to delete file: ', err)
    }
  }
}
