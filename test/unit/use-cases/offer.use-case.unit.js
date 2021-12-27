/*
  Unit tests for the Offer Use Case library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local support libraries
// const testUtils = require('../../utils/test-utils')

// Unit under test (uut)
const OfferLib = require('../../../src/use-cases/offer')
const adapters = require('../mocks/adapters')
const { AvalancheWallet } = require('../mocks/adapters/wallet')

describe('#offer-use-case', () => {
  /** @type {OfferLib} */
  let uut
  /** @type {sinon.SinonSandbox} */
  let sandbox

  before(async () => {
    // Delete all previous users in the database.
    // await testUtils.deleteAllUsers()
  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    adapters.wallet.avaxWallet.setUtxos()
    uut = new OfferLib({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new OfferLib()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of adapters must be passed in when instantiating Offer Use Cases library.'
        )
      }
    })
  })

  describe('#createOffer', () => {
    it('should create an offer and return the hash', async () => {
      const entryObj = {
        lokadId: 'SWP',
        messageType: 1,
        messageClass: 1,
        tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        buyOrSell: 'sell',
        rateInSats: 1000,
        minSatsToExchange: 1250,
        numTokens: 1
      }

      const newAddress = await uut.getAddress(1)

      // Mock dependencies
      sandbox.stub(uut.offerEntity, 'validate').returns(entryObj)
      sandbox.stub(uut, 'ensureFunds').resolves()
      sandbox.stub(uut.adapters.p2wdb, 'checkForSufficientFunds').resolves()
      sandbox.stub(uut, 'getAddress').resolves(newAddress)
      sandbox.stub(uut, 'moveTokens').resolves({ txid: 'fakeTxid', vout: '000000' })
      sandbox.stub(uut.adapters.wallet, 'createPartialTxHex').resolves({
        txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0' +
          '000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000' +
          '000070000000000002710000000000000000000000001000000012a911a32b2dcfa390b020' +
          'b406131df356b84a2a100000001db20a53856ff6c6a1ea2721ac5c007698f9e5dba157a3f1' +
          '4aac0a26521f112a200000002f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea2' +
          '85fefa5a86f5e16000000050000000000013043000000010000000000000000',
        addrReferences: '{"2fWKUBaTWfrbs5uHJvnFzyLsBg3b7yNkWHFYWrdGJYHCRwa3ww":"X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd"}'
      })
      sandbox.stub(uut.adapters.p2wdb, 'write').resolves('fakeHash')
      sandbox
        .stub(uut.adapters.wallet.bchWallet.bchjs.Util, 'sleep')
        .resolves()

      const result = await uut.createOffer(entryObj)

      assert.isString(result)
      assert.equal(result, 'fakeHash')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.offerEntity, 'validate')
          .throws(new Error('test error'))

        await uut.createOffer()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#ensureFunds', () => {
    it('should return true if wallet has enough funds for a sell order', async () => {
      const offerEntity = {
        lokadId: 'SWP',
        messageType: 1,
        messageClass: 1,
        tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        buyOrSell: 'sell',
        rateInSats: 1000,
        minSatsToExchange: 0,
        numTokens: 1
      }

      const result = await uut.ensureFunds(offerEntity)

      assert.equal(result, true)
    })

    it('should throw an error if the wallet doesnt have enough tokens', async () => {
      try {
        const offerEntity = {
          lokadId: 'SWP',
          messageType: 1,
          messageClass: 1,
          tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 0,
          numTokens: 4
        }
        await uut.ensureFunds(offerEntity)
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'App wallet does not have enough tokens to satisfy the SELL offer')
      }
    })

    it('should return true if buy', async () => {
      const offerEntity = { buyOrSell: 'buy' }
      const result = await uut.ensureFunds(offerEntity)

      assert.equal(result, true)
    })
  })

  describe('#moveTokens', () => {
    it('should move tokens to the holding address', async () => {
      const offerEntity = {
        lokadId: 'SWP',
        messageType: 1,
        messageClass: 1,
        tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        buyOrSell: 'sell',
        rateInSats: 1000,
        minSatsToExchange: 0,
        numTokens: 1
      }

      const walletInfo = await uut.getAddress(1)

      sandbox.stub(uut.adapters.wallet.avaxWallet, 'send').resolves('fakeTxid')

      const result = await uut.moveTokens(offerEntity, walletInfo)
      // console.log('result: ', result)

      assert.property(result, 'txid')
      assert.property(result, 'vout')

      assert.equal(result.txid, 'fakeTxid')
      assert.equal(result.vout, 0)
    })

    it('should catch an error', async () => {
      sandbox.stub(uut.adapters.wallet.avaxWallet, 'send').rejects(
        new Error('intended error')
      )

      const offerEntity = {
        lokadId: 'SWP',
        messageType: 1,
        messageClass: 1,
        tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        buyOrSell: 'sell',
        rateInSats: 1000,
        minSatsToExchange: 0,
        numTokens: 1
      }

      try {
        const walletInfo = await uut.getAddress(1)
        await uut.moveTokens(offerEntity, walletInfo)
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'intended error')
      }
    })
  })

  describe('#getAddress', () => {
    it('should retrieve a new key pair from the HD key ring', async () => {
      const result = await uut.getAddress(1)
      // mock wallet
      const wallet = new AvalancheWallet()
      uut.adapters.wallet.avaxWallet = wallet

      assert.hasAllKeys(result, ['address', 'privateKey', 'publicKey', 'hdIndex'])
      assert.equal(result.address, wallet.walletInfo.address)
      assert.equal(result.privateKey, wallet.walletInfo.privateKey)
      assert.equal(result.publicKey, wallet.walletInfo.publicKey)
      assert.equal(result.hdIndex, 1)
    })

    it('should catch and throw an error', async () => {
      try {
        sandbox.stub(uut.adapters.wallet, 'getAvaxKeyPair').throws(new Error('test error'))
        await uut.getAddress(1)

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'test error')
      }
    })
  })
})
