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
    it('should create a sell offer and return the hash', async () => {
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
      sandbox.stub(uut.adapters.wallet, 'getAmountInSats').resolves(100)
      const ensureStub = sandbox.stub(uut, 'ensureFunds').resolves()
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

      const [offered, isForSale] = ensureStub.args[0]
      assert.isTrue(isForSale) // check if sell as buy offer
      assert.equal(offered.assetID, entryObj.tokenId)
      assert.equal(offered.amount, 100)
    })

    it('should create a buy offer and return the hash', async () => {
      const entryObj = {
        lokadId: 'SWP',
        messageType: 1,
        messageClass: 1,
        tokenId: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        buyOrSell: 'buy',
        rateInSats: 2000000,
        minSatsToExchange: 10,
        numTokens: 0.5
      }

      const newAddress = await uut.getAddress(1)

      // Mock dependencies
      sandbox.stub(uut.offerEntity, 'validate').returns(entryObj)
      sandbox.stub(uut.adapters.wallet, 'getAmountInSats').resolves(50)
      const ensureStub = sandbox.stub(uut, 'ensureFunds').resolves()
      sandbox.stub(uut.adapters.p2wdb, 'checkForSufficientFunds').resolves()
      sandbox.stub(uut, 'getAddress').resolves(newAddress)
      sandbox.stub(uut, 'moveTokens').resolves({ txid: 'fakeTxid', vout: '000000' })
      sandbox.stub(uut.adapters.wallet, 'createPartialTxHex').resolves({
        txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
          '4b00000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57' +
          'c64500000007000000000000003200000000000000000000000100000001899c60081d' +
          '331395dc13f93149f3ddc6ab7d559b00000001bb94cee441f3f9ef21d6201251043f7f' +
          '08ee9936d0c2de7d1e2439f2c00837d00000000021e67317cbc4be2aeb00677ad64627' +
          '78a8f52274b9d605df2591b23027a87dff0000000500000000002dc6c0000000010000' +
          '000000000000',
        addrReferences: '{"2RcWhf6FfmRkBbnAfzDvty21B7n5ki8k5Ku9M2th8WktusRdL3":"X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd"}'
      })
      sandbox.stub(uut.adapters.p2wdb, 'write').resolves('fakeHash')
      sandbox
        .stub(uut.adapters.wallet.bchWallet.bchjs.Util, 'sleep')
        .resolves()

      const result = await uut.createOffer(entryObj)

      assert.isString(result)
      assert.equal(result, 'fakeHash')

      const [offered, isForSale] = ensureStub.args[0]
      assert.isFalse(isForSale) // check if taken as buy offer
      assert.equal(offered.assetID, 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z')
      assert.equal(offered.amount, 2000000)
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
      const isForSale = true
      const offered = {
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        amount: 200
      }

      const result = await uut.ensureFunds(offered, isForSale)

      assert.equal(result, true)
    })

    it('should return true if wallet has enough funds for a buy order', async () => {
      const isForSale = false
      const offered = {
        assetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        amount: 2000000
      }

      const result = await uut.ensureFunds(offered, isForSale)

      assert.equal(result, true)
    })

    it('should throw an error if the wallet doesnt have enough tokens', async () => {
      try {
        const isForSale = true
        const offered = {
          assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
          amount: 400
        }
        await uut.ensureFunds(offered, isForSale)
        assert.fail('unexpected result')
      } catch (error) {
        assert.include(error.message, 'App wallet does not have enough tokens to satisfy the offer')
      }
    })
  })

  describe('#moveTokens', () => {
    it('should move tokens to the holding address', async () => {
      const isForSale = true
      const offered = {
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        amount: 200
      }

      const walletInfo = await uut.getAddress(1)

      const sendStub = sandbox.stub(uut.adapters.wallet.avaxWallet, 'send').resolves('fakeTxid')
      sandbox.stub(uut.adapters.wallet, 'findTxOut').resolves({ vout: 0 })

      const result = await uut.moveTokens(offered, walletInfo, isForSale)
      // console.log('result: ', result)

      assert.property(result, 'txid')
      assert.property(result, 'vout')

      assert.equal(result.txid, 'fakeTxid')
      assert.equal(result.vout, 0)

      const { address, amount, assetID } = sendStub.args[0][0][0]
      assert.equal(address, walletInfo.address)
      assert.equal(amount, 200)
      assert.equal(assetID, offered.assetID)
    })

    it('should add the fee when it\'s a buy offer', async () => {
      const isForSale = false
      const offered = {
        assetID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        amount: 2000000
      }

      const walletInfo = await uut.getAddress(1)

      const sendStub = sandbox.stub(uut.adapters.wallet.avaxWallet, 'send').resolves('fakeTxid')
      sandbox.stub(uut.adapters.wallet, 'findTxOut').resolves({ vout: 0 })

      const result = await uut.moveTokens(offered, walletInfo, isForSale)
      // console.log('result: ', result)

      assert.property(result, 'txid')
      assert.property(result, 'vout')

      assert.equal(result.txid, 'fakeTxid')
      assert.equal(result.vout, 0)

      const { address, amount, assetID } = sendStub.args[0][0][0]
      assert.equal(address, walletInfo.address)
      assert.equal(amount, 3000000)
      assert.equal(assetID, offered.assetID)
    })

    it('should catch an error', async () => {
      sandbox.stub(uut.adapters.wallet.avaxWallet, 'send').rejects(
        new Error('intended error')
      )
      const isForSale = true
      const offered = {
        assetID: '2jgTFB6MM4vwLzUNWFYGPfyeQfpLaEqj4XWku6FoW7vaGrrEd5',
        amount: 200
      }

      try {
        const walletInfo = await uut.getAddress(1)
        await uut.moveTokens(offered, walletInfo, isForSale)
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

  describe('#listOffers', () => {
    it('should return a list of offers', async () => {
      sandbox.stub(uut.OfferModel, 'find').resolves([{
        _id: '61d8c3b6faabfd0d5f18cae7',
        messageType: 1,
        messageClass: 1,
        tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
        buyOrSell: 'sell',
        rateInSats: '1000',
        minSatsToExchange: '10',
        numTokens: 21,
        utxoTxid: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
        utxoVout: 1,
        txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000000003e8000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a100000001a045bd411acbb02ab31b1ac9a29cbd9e27001d5940a9291fc053d7683e716afc00000001f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e16000000050000000000000834000000010000000000000000',
        addrReferences: '{"2Dawk4kFbEj5dmKcaEoZvmTfrWUcUFN22oEwMt1GByqMatzZbN":"X-avax1n72fnh2y2v56h5k8q08yze63yuykkkmxjqycf3"}',
        hdIndex: 3,
        p2wdbHash: 'zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE'
      }])

      const offers = await uut.listOffers()

      assert.isArray(offers)
      assert.hasAllKeys(offers[0], [
        '_id',
        'messageType',
        'messageClass',
        'tokenId',
        'buyOrSell',
        'rateInSats',
        'minSatsToExchange',
        'numTokens',
        'utxoTxid',
        'utxoVout',
        'txHex',
        'addrReferences',
        'hdIndex',
        'p2wdbHash'
      ])
    })

    it('should throw an error', async () => {
      try {
        sandbox.stub(uut.OfferModel, 'find').rejects(new Error('localdb error'))
        await uut.listOffers()
      } catch (error) {
        assert.include(error.message, 'localdb error')
      }
    })
  })

  describe('#findOfferByHash', () => {
    it('should return an offer by a given p2wdb hash', async () => {
      sandbox.stub(uut.OfferModel, 'findOne').resolves({
        toObject: () => ({
          _id: '61d8c3b6faabfd0d5f18cae7',
          messageType: 1,
          messageClass: 1,
          tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
          buyOrSell: 'sell',
          rateInSats: '1000',
          minSatsToExchange: '10',
          numTokens: 21,
          utxoTxid: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
          utxoVout: 1,
          txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000000003e8000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a100000001a045bd411acbb02ab31b1ac9a29cbd9e27001d5940a9291fc053d7683e716afc00000001f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e16000000050000000000000834000000010000000000000000',
          addrReferences: '{"2Dawk4kFbEj5dmKcaEoZvmTfrWUcUFN22oEwMt1GByqMatzZbN":"X-avax1n72fnh2y2v56h5k8q08yze63yuykkkmxjqycf3"}',
          hdIndex: 3,
          p2wdbHash: 'zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE'
        })
      })

      const offer = await uut.findOfferByHash('zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE')

      assert.hasAllKeys(offer, [
        '_id',
        'messageType',
        'messageClass',
        'tokenId',
        'buyOrSell',
        'rateInSats',
        'minSatsToExchange',
        'numTokens',
        'utxoTxid',
        'utxoVout',
        'txHex',
        'addrReferences',
        'hdIndex',
        'p2wdbHash'
      ])
    })

    it('should throw an error if the given hash is not a string', async () => {
      const consoleSpy = sandbox.spy(global.console, 'error')
      const findSpy = sandbox.spy(uut.OfferModel, 'findOne')

      try {
        await uut.findOfferByHash()
      } catch (error) {
        assert.include(error.message, 'p2wdbHash must be a string')
        assert.isTrue(consoleSpy.called)
        assert.isTrue(findSpy.notCalled)
      }
    })

    it('should throw an error if the given hash doesnt match any offer', async () => {
      const consoleSpy = sandbox.spy(global.console, 'error')
      const findSpy = sandbox.stub(uut.OfferModel, 'findOne')
      findSpy.resolves(null)
      try {
        await uut.findOfferByHash('zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE')
      } catch (error) {
        assert.include(error.message, 'offer not found')
        assert.isTrue(consoleSpy.called)
        assert.isTrue(findSpy.called)
      }
    })
  })
})
