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
        '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
        '4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a8' +
        '7dff000000070000000000002710000000000000000000000001000000012a911a32b2' +
        'dcfa390b020b406131df356b84a2a1000000015bdf7b977813f604ac5c285f4571db90' +
        '6afdf4e1197e2a39e9284a73976e269100000002f808d594b0360d20f7b4214bdb51a7' +
        '73d0f5eb34c5157eea285fefa5a86f5e16000000050000000000011d1f000000010000' +
        '000000000000'
      )
      assert.equal(result.addrReferences, '{"hTmmsBQuBmR91X9xE2cNuveLd45ox7oAGvZukczQHXhKhuaa5":"X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd"}')
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

  describe('#takePartialTxHex', () => {
    const txHex = '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
      '4b0000000221e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a8' +
      '7dff000000070000000001312d0000000000000000000000000100000001639779b615' +
      'd3d9052915ba105bb26627383225c2f808d594b0360d20f7b4214bdb51a773d0f5eb34' +
      'c5157eea285fefa5a86f5e16000000070000000000001b580000000000000000000000' +
      '0100000001639779b615d3d9052915ba105bb26627383225c2000000026a9802ce0e67' +
      '81104c752ab0e597b33d10d398a170479390fc5364f7ec2024d100000004f808d594b0' +
      '360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e160000000500000000' +
      '00001b580000000100000000ebd62c45493b7414ff03147d59d5a8c61521fc784a942f' +
      '772beb64c6c6a9c58400000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481' +
      'a9cb862f4b0b7d57c64500000005000000000000006400000001000000000000002254' +
      '7820637265617465642066726f6d206f66666572206d616b6520636f6d6d616e64'
    const addrReferences = {
      Bmf8WUVKkiP97rFf3vFERoiWZy634WfpMKuWrJJ1x3YjMLcbi: 'X-avax1jzrstc0mvwk9m4hqmz0fyxcvx2mkzwdtmqpppr'
    }

    it('should complete', async () => {
      // mock instance of minimal-avax-wallet
      uut.avaxWallet = new AvalancheWallet()
      uut.avaxWallet.utxos.utxoStore[2].amount = 30000000
      const result = await uut.takePartialTxHex(txHex, addrReferences)

      assert.hasAllKeys(result, ['txHex', 'addrReferences'])
    })

    it('should exit with error status if the wallet doesnt have the asset', async () => {
      try {
        uut.avaxWallet = new AvalancheWallet()
        uut.avaxWallet.utxos.assets = []

        await uut.takePartialTxHex(txHex, addrReferences)
        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'Insufficient funds. You are trying to send AVAX, but the wallet doesn\'t have any',
          'Expected error message'
        )
      }
    })

    it('should exit with error status if the wallet doesnt have enough AVAX to send', async () => {
      try {
        uut.avaxWallet = new AvalancheWallet()
        uut.avaxWallet.utxos.utxoStore = null

        await uut.takePartialTxHex(txHex, addrReferences)
        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'Not enough avax in the selected address',
          'Expected error message'
        )
      }
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

  describe('#completeTxHex', () => {
    const hdIndex = 3
    const txHex = '00000000000000000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae' +
      '10626739e35c4b0000000421e67317cbc4be2aeb00677ad6462778a8f52274b9d605df' +
      '2591b23027a87dff000000070000000000989680000000000000000000000001000000' +
      '01908705e1fb63ac5dd6e0d89e921b0c32b76139ab21e67317cbc4be2aeb00677ad646' +
      '2778a8f52274b9d605df2591b23027a87dff00000007000000000121eac00000000000' +
      '00000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a1e49b53ab' +
      '21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c64500000007000000' +
      '0000000032000000000000000000000001000000012a911a32b2dcfa390b020b406131' +
      'df356b84a2a1e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d' +
      '57c64500000007000000000000003200000000000000000000000100000001908705e1' +
      'fb63ac5dd6e0d89e921b0c32b76139ab0000000218745a2beff9066fa451d26bd869b9' +
      'd893fe106c23f990ce39bae861f5e7cb5e00000001e49b53ab21c6f7b10bf8efb3e3bc' +
      '0059954989b3d481a9cb862f4b0b7d57c6450000000500000000000000640000000100' +
      '00000021fb8df61ac586407cbca7da26a0385a72e88dc0bf6e01a772b9ae400da10336' +
      '0000000021e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87d' +
      'ff000000050000000001c9c38000000001000000000000000000000002000000090000' +
      '0000000000090000000102a6d91c7a71692d95fd2c73d00a0f1b64b2e76738410fce06' +
      '5cc79f2ca9a6b14c88baf4c3fc679a1af5af76aa29b2e6fc9b1f8ce04a63b517c087dd' +
      '3041f2cd00'
    const addrReferences = {
      Bmf8WUVKkiP97rFf3vFERoiWZy634WfpMKuWrJJ1x3YjMLcbi: 'X-avax15d4zzjxsl02qpx60xupnz7z3sxagans7dwgyzj',
      Fy3NFR7DrriWWNBpogrsgXoAmZpdYcoRHz6n7uW17nRBaqovw: 'X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd'
    }

    it('should throw an error if the signatures are not completed', async () => {
      uut.avaxWallet = new AvalancheWallet()

      const ref = {
        '2ns8XVRdy8TRVJJaa9BTNTu2AvpdGweQ3vXfq3WnJVzAn2Qp9E': 'X-avax1x47tu0zj4ss3lf4kvmvyk0hk4gwp07t7jhh0kn'
      }

      try {
        await uut.completeTxHex(txHex, ref, hdIndex)
      } catch (error) {
        assert.equal('The transaction is not fully signed', error.message)
      }
    })

    it('should broadcast the tx and return the txid', async () => {
      uut.avaxWallet = new AvalancheWallet()
      uut.AvaxWallet = AvalancheWallet

      try {
        const res = await uut.completeTxHex(txHex, addrReferences, hdIndex)
        assert.equal(res.txid, 'txid')
      } catch (error) {
        assert.fail('Unexpected code path')
      }
    })
  })

  describe('#validateIntegrity', () => {
    it('should return false if there are extra inputs that mismatch the original', async () => {
      uut.avaxWallet = new AvalancheWallet()

      // Offer has an input thats not present in the Order
      const offerHex = '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
        '4b0000000221e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a8' +
        '7dff000000070000000001312d0000000000000000000000000100000001639779b615' +
        'd3d9052915ba105bb26627383225c2f808d594b0360d20f7b4214bdb51a773d0f5eb34' +
        'c5157eea285fefa5a86f5e16000000070000000000001b580000000000000000000000' +
        '0100000001639779b615d3d9052915ba105bb26627383225c2000000026a9802ce0e67' +
        '81104c752ab0e597b33d10d398a170479390fc5364f7ec2024d100000004f808d594b0' +
        '360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e160000000500000000' +
        '00001b580000000100000000ebd62c45493b7414ff03147d59d5a8c61521fc784a942f' +
        '772beb64c6c6a9c58400000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481' +
        'a9cb862f4b0b7d57c64500000005000000000000006400000001000000000000002254' +
        '7820637265617465642066726f6d206f66666572206d616b6520636f6d6d616e64'
      const orderHex = '00000000000000000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae' +
        '10626739e35c4b0000000321e67317cbc4be2aeb00677ad6462778a8f52274b9d605df' +
        '2591b23027a87dff0000000700000000005b8d80000000000000000000000001000000' +
        '012a911a32b2dcfa390b020b406131df356b84a2a121e67317cbc4be2aeb00677ad646' +
        '2778a8f52274b9d605df2591b23027a87dff0000000700000000009896800000000000' +
        '0000000000000100000001908705e1fb63ac5dd6e0d89e921b0c32b76139abe49b53ab' +
        '21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c64500000007000000' +
        '0000000064000000000000000000000001000000012a911a32b2dcfa390b020b406131' +
        'df356b84a2a10000000218745a2beff9066fa451d26bd869b9d893fe106c23f990ce39' +
        'bae861f5e7cb5e00000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb' +
        '862f4b0b7d57c64500000005000000000000006400000001000000005bdf7b977813f6' +
        '04ac5c285f4571db906afdf4e1197e2a39e9284a73976e26910000000021e67317cbc4' +
        'be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000000050000000001' +
        '036640000000010000000000000022547820637265617465642066726f6d206f666665' +
        '722074616b6520636f6d6d616e64000000020000000900000000000000090000000169' +
        '7ad8096a0f48aaf3bca4c151375f1ffee13f582e0c6c933f1d3d27cad78ebe6bdc4726' +
        '131e5b0c3325e365bd0735cac870a5f5422a6bc6a05ad12d0c65bcd500'

      const res = await uut.validateIntegrity(offerHex, orderHex)
      assert.isFalse(res.valid)
      assert.include(res.message, 'is not present in the order')
    })

    it('should return false if the original outputs are not present or have been modified', async () => {
      uut.avaxWallet = new AvalancheWallet()

      // Offer must return 0.5 tokens to origin address
      // but order is set to give it all to the buyer
      const offerHex = '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
        '4b0000000221e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a8' +
        '7dff00000007000000000098968000000000000000000000000100000001908705e1fb' +
        '63ac5dd6e0d89e921b0c32b76139abe49b53ab21c6f7b10bf8efb3e3bc0059954989b3' +
        'd481a9cb862f4b0b7d57c6450000000700000000000000320000000000000000000000' +
        '0100000001908705e1fb63ac5dd6e0d89e921b0c32b76139ab0000000118745a2beff9' +
        '066fa451d26bd869b9d893fe106c23f990ce39bae861f5e7cb5e00000001e49b53ab21' +
        'c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c6450000000500000000' +
        '00000064000000010000000000000022547820637265617465642066726f6d206f6666' +
        '6572206d616b6520636f6d6d616e64'
      const orderHex = '00000000000000000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae' +
        '10626739e35c4b0000000321e67317cbc4be2aeb00677ad6462778a8f52274b9d605df' +
        '2591b23027a87dff0000000700000000005b8d80000000000000000000000001000000' +
        '012a911a32b2dcfa390b020b406131df356b84a2a121e67317cbc4be2aeb00677ad646' +
        '2778a8f52274b9d605df2591b23027a87dff0000000700000000009896800000000000' +
        '0000000000000100000001908705e1fb63ac5dd6e0d89e921b0c32b76139abe49b53ab' +
        '21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c64500000007000000' +
        '0000000064000000000000000000000001000000012a911a32b2dcfa390b020b406131' +
        'df356b84a2a10000000218745a2beff9066fa451d26bd869b9d893fe106c23f990ce39' +
        'bae861f5e7cb5e00000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb' +
        '862f4b0b7d57c64500000005000000000000006400000001000000005bdf7b977813f6' +
        '04ac5c285f4571db906afdf4e1197e2a39e9284a73976e26910000000021e67317cbc4' +
        'be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000000050000000001' +
        '036640000000010000000000000022547820637265617465642066726f6d206f666665' +
        '722074616b6520636f6d6d616e64000000020000000900000000000000090000000169' +
        '7ad8096a0f48aaf3bca4c151375f1ffee13f582e0c6c933f1d3d27cad78ebe6bdc4726' +
        '131e5b0c3325e365bd0735cac870a5f5422a6bc6a05ad12d0c65bcd500'

      const res = await uut.validateIntegrity(offerHex, orderHex)
      assert.isFalse(res.valid)
      assert.include(res.message, 'Missing output with asset')
    })

    it('should return false if the original outputs are not present or have been modified', async () => {
      uut.avaxWallet = new AvalancheWallet()

      // Offer and taken order have the inital inputs and outputs
      const offerHex = '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
        '4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a8' +
        '7dff00000007000000000098968000000000000000000000000100000001908705e1fb' +
        '63ac5dd6e0d89e921b0c32b76139ab0000000118745a2beff9066fa451d26bd869b9d8' +
        '93fe106c23f990ce39bae861f5e7cb5e00000001e49b53ab21c6f7b10bf8efb3e3bc00' +
        '59954989b3d481a9cb862f4b0b7d57c645000000050000000000000064000000010000' +
        '000000000022547820637265617465642066726f6d206f66666572206d616b6520636f' +
        '6d6d616e64'
      const orderHex = '00000000000000000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae' +
        '10626739e35c4b0000000321e67317cbc4be2aeb00677ad6462778a8f52274b9d605df' +
        '2591b23027a87dff0000000700000000005b8d80000000000000000000000001000000' +
        '012a911a32b2dcfa390b020b406131df356b84a2a121e67317cbc4be2aeb00677ad646' +
        '2778a8f52274b9d605df2591b23027a87dff0000000700000000009896800000000000' +
        '0000000000000100000001908705e1fb63ac5dd6e0d89e921b0c32b76139abe49b53ab' +
        '21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c64500000007000000' +
        '0000000064000000000000000000000001000000012a911a32b2dcfa390b020b406131' +
        'df356b84a2a10000000218745a2beff9066fa451d26bd869b9d893fe106c23f990ce39' +
        'bae861f5e7cb5e00000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb' +
        '862f4b0b7d57c64500000005000000000000006400000001000000005bdf7b977813f6' +
        '04ac5c285f4571db906afdf4e1197e2a39e9284a73976e26910000000021e67317cbc4' +
        'be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000000050000000001' +
        '036640000000010000000000000022547820637265617465642066726f6d206f666665' +
        '722074616b6520636f6d6d616e64000000020000000900000000000000090000000169' +
        '7ad8096a0f48aaf3bca4c151375f1ffee13f582e0c6c933f1d3d27cad78ebe6bdc4726' +
        '131e5b0c3325e365bd0735cac870a5f5422a6bc6a05ad12d0c65bcd500'

      const res = await uut.validateIntegrity(offerHex, orderHex)
      assert.isTrue(res.valid)
      assert.isTrue(res.message === undefined)
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
