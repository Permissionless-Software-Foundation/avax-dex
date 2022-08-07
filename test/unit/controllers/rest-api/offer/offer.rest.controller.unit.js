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

describe('#Offer-REST-Controller', () => {
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

  describe('#checkStatusByOfferHash', () => {
    const offerHash = 'zdpuB1yPwL9FdpvtD5rP7b2Pk77ZdNNVzn2hG2KEvYmij1UE2'

    it('should return the order if the offer was taken', async () => {
      ctx.request.body = { hash: offerHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const checkOrderStub = sandbox.stub(uut.useCases.order, 'checkTakenOrder')
      checkOrderStub.resolves({
        orderStatus: 'taken',
        p2wdbHash: 'zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2',
        offerHash
      })

      await uut.checkStatusByOfferHash(ctx)

      assert.isTrue(checkOrderStub.calledWith(offerHash))
      assert.property(ctx.body, 'order')
      assert.typeOf(ctx.body.order, 'object')

      assert.isFalse(handleErrorSpy.called)
    })

    it('should return false if the offer has not been taken', async () => {
      ctx.request.body = { hash: offerHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const checkOrderStub = sandbox.stub(uut.useCases.order, 'checkTakenOrder')
      checkOrderStub.resolves(false)

      await uut.checkStatusByOfferHash(ctx)

      assert.isTrue(checkOrderStub.calledWith(offerHash))
      assert.property(ctx.body, 'order')
      assert.isFalse(ctx.body.order)

      assert.isFalse(handleErrorSpy.called)
    })

    it('should throw and catch an error', async () => {
      ctx.request.body = { hash: offerHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const checkOrderStub = sandbox.stub(uut.useCases.order, 'checkTakenOrder')
      checkOrderStub.rejects(new Error('intended error'))

      try {
        await uut.checkStatusByOfferHash(ctx)
      } catch (error) {
        assert.isTrue(checkOrderStub.calledWith(offerHash))
        assert.isTrue(handleErrorSpy.called)
      }
    })
  })

  describe('#acceptOffer', () => {
    const orderHash = 'zdpuB1yPwL9FdpvtD5rP7b2Pk77ZdNNVzn2hG2KEvYmij1UE2'
    const offerHash = 'zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE'

    it('should return the txid and the p2wdb hash', async () => {
      ctx.request.body = { hash: orderHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')

      const orderByHashStub = sandbox.stub(uut.useCases.order, 'findOrderByHash')
      const orderMock = {
        orderStatus: 'taken',
        txHex: 'partiallySignedHex',
        p2wdbHash: orderHash,
        offerHash
      }
      orderByHashStub.resolves(orderMock)

      const offerByHashStub = sandbox.stub(uut.useCases.offer, 'findOfferByHash')
      const offerMock = {
        txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000000003e8000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a100000001a045bd411acbb02ab31b1ac9a29cbd9e27001d5940a9291fc053d7683e716afc00000001f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e16000000050000000000000834000000010000000000000000',
        p2wdbHash: offerHash,
        hdIndex: 3
      }
      offerByHashStub.resolves(offerMock)

      const completeOrderStub = sandbox.stub(uut.useCases.order, 'completeOrder')
      completeOrderStub.resolves({ hash: 'hash', txid: 'txid' })

      await uut.acceptOffer(ctx)

      assert.isTrue(orderByHashStub.calledWith(orderHash))
      assert.isTrue(offerByHashStub.calledWith(offerHash))
      assert.isTrue(completeOrderStub.calledWith({
        offerTxHex: offerMock.txHex,
        hdIndex: offerMock.hdIndex,
        orderEntity: orderMock
      }))
      assert.hasAllKeys(ctx.body, ['txid'])
      assert.isTrue(handleErrorSpy.notCalled)
    })

    it('should throw and catch an error', async () => {
      ctx.request.body = { hash: orderHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const orderByHashStub = sandbox.stub(uut.useCases.order, 'findOrderByHash')
      orderByHashStub.rejects(new Error('Order not found'))

      try {
        await uut.acceptOffer(ctx)
      } catch (error) {
        assert.isTrue(orderByHashStub.calledWith(orderHash))
        assert.isTrue(handleErrorSpy.called)
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
