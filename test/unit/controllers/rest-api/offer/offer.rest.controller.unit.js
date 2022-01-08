/*
  Unit tests for the REST API handler for the /offer endpoints.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local support libraries
const adapters = require('../../../mocks/adapters')
const UseCasesMock = require('../../../mocks/use-cases')
// const app = require('../../../mocks/app-mock')

const OfferRESTController = require('../../../../../src/controllers/rest-api/offer/controller')
let uut
/** @type {sinon.SinonSandbox} */
let sandbox
let ctx

const mockContext = require('../../../../unit/mocks/ctx-mock').context

describe('#Offer-REST-Router', () => {
  // const testUser = {}

  beforeEach(() => {
    const useCases = new UseCasesMock()
    uut = new OfferRESTController({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new OfferRESTController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating /offer REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new OfferRESTController({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating /offer REST Controller.'
        )
      }
    })
  })

  describe('#createOffer', () => {
    it('should create a new offer', async () => {
      ctx.request.body = {
        offer: {}
      }

      // Mock dependencies
      sandbox.stub(uut.useCases.offer, 'createOffer').resolves('testHash')

      await uut.createOffer(ctx)

      assert.equal(ctx.body.hash, 'testHash')
    })

    it('should catch and throw an error', async () => {
      try {
        ctx.request.body = {
          offer: {}
        }

        // Force an error
        sandbox
          .stub(uut.useCases.offer, 'createOffer')
          .rejects(new Error('test error'))

        await uut.createOffer(ctx)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#listOffers', () => {
    it('should run the correct methods', async () => {
      sandbox.stub(uut.useCases.offer, 'listOffers').resolves([{
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
      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const consoleSpy = sandbox.spy(global.console, 'log')

      await uut.listOffers(ctx)

      assert.isTrue(handleErrorSpy.notCalled)
      assert.isTrue(consoleSpy.notCalled)
    })

    it('should throw an error', async () => {
      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const consoleSpy = sandbox.spy(global.console, 'log')
      sandbox.stub(uut.useCases.offer, 'listOffers').rejects(new Error('localdb error'))

      try {
        await uut.listOffers(ctx)
      } catch (error) {
        assert.isTrue(handleErrorSpy.calledOnce)
        assert.isTrue(consoleSpy.calledTwice)
      }
    })
  })

  describe('#handleError', () => {
    it('should still throw error if there is no message', () => {
      try {
        const err = {
          status: 404
        }

        uut.handleError(ctx, err)
      } catch (err) {
        assert.include(err.message, 'Not Found')
      }
    })
    it('should catch error if message is provided', () => {
      try {
        const err = {
          status: 422,
          message: 'Unprocessable Entity'
        }

        uut.handleError(ctx, err)
      } catch (err) {
        assert.include(err.message, 'Unprocessable Entity')
      }
    })
  })
})
