/*
  Unit tests for the REST API handler for the /order endpoints.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local support libraries
const adapters = require('../../../mocks/adapters')
const UseCasesMock = require('../../../mocks/use-cases')
// const app = require('../../../mocks/app-mock')

const OrderRESTController = require('../../../../../src/controllers/rest-api/order/controller')
let uut
/** @type {sinon.SinonSandbox} */
let sandbox
let ctx

const mockContext = require('../../../../unit/mocks/ctx-mock').context

describe('#Order-REST-Controller', () => {
  // const testUser = {}

  beforeEach(() => {
    const useCases = new UseCasesMock()
    uut = new OrderRESTController({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new OrderRESTController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating /order REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new OrderRESTController({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating /order REST Controller.'
        )
      }
    })
  })

  describe('#createOrder', () => {
    it('should create a new order', async () => {
      ctx.request.body = {
        order: {}
      }

      // Mock dependencies
      sandbox.stub(uut.useCases.order, 'createOrder').resolves('testHash')

      await uut.createOrder(ctx)

      assert.equal(ctx.body.hash, 'testHash')
    })

    it('should catch and throw an error', async () => {
      try {
        ctx.request.body = {
          order: {}
        }

        // Force an error
        sandbox
          .stub(uut.useCases.order, 'createOrder')
          .rejects(new Error('test error'))

        await uut.createOrder(ctx)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#listOrders', () => {
    it('should run the correct methods', async () => {
      sandbox.stub(uut.useCases.order, 'listOrders').resolves([{
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

      await uut.listOrders(ctx)

      assert.isTrue(handleErrorSpy.notCalled)
      assert.isTrue(consoleSpy.notCalled)
    })

    it('should throw an error', async () => {
      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const consoleSpy = sandbox.spy(global.console, 'log')
      sandbox.stub(uut.useCases.order, 'listOrders').rejects(new Error('localdb error'))

      try {
        await uut.listOrders(ctx)
      } catch (error) {
        assert.isTrue(handleErrorSpy.calledOnce)
        assert.isTrue(consoleSpy.calledTwice)
      }
    })
  })

  describe('#checkStatusByOrderHash', () => {
    const orderHash = 'zdpuB1yPwL9FdpvtD5rP7b2Pk77ZdNNVzn2hG2KEvYmij1UE2'

    it('should return the order if the order was taken', async () => {
      ctx.request.body = { hash: orderHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const checkOrderStub = sandbox.stub(uut.useCases.order, 'checkTakenOrder')
      checkOrderStub.resolves({
        orderStatus: 'taken',
        p2wdbHash: 'zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2',
        orderHash
      })

      await uut.checkStatusByOrderHash(ctx)

      assert.isTrue(checkOrderStub.calledWith(orderHash))
      assert.property(ctx.body, 'order')
      assert.typeOf(ctx.body.order, 'object')

      assert.isFalse(handleErrorSpy.called)
    })

    it('should return false if the order has not been taken', async () => {
      ctx.request.body = { hash: orderHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const checkOrderStub = sandbox.stub(uut.useCases.order, 'checkTakenOrder')
      checkOrderStub.resolves(false)

      await uut.checkStatusByOrderHash(ctx)

      assert.isTrue(checkOrderStub.calledWith(orderHash))
      assert.property(ctx.body, 'order')
      assert.isFalse(ctx.body.order)

      assert.isFalse(handleErrorSpy.called)
    })

    it('should throw and catch an error', async () => {
      ctx.request.body = { hash: orderHash }

      const handleErrorSpy = sandbox.spy(uut, 'handleError')
      const checkOrderStub = sandbox.stub(uut.useCases.order, 'checkTakenOrder')
      checkOrderStub.rejects(new Error('intended error'))

      try {
        await uut.checkStatusByOrderHash(ctx)
      } catch (error) {
        assert.isTrue(checkOrderStub.calledWith(orderHash))
        assert.isTrue(handleErrorSpy.called)
      }
    })
  })

  describe('#acceptOrder', () => {
    // const orderHash = 'zdpuB1yPwL9FdpvtD5rP7b2Pk77ZdNNVzn2hG2KEvYmij1UE2'
    // const offerHash = 'zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE'

    // it('should return the txid and the p2wdb hash', async () => {
    //   ctx.request.body = { hash: orderHash }
    //
    //   const handleErrorSpy = sandbox.spy(uut, 'handleError')
    //
    //   const orderByHashStub = sandbox.stub(uut.useCases.order, 'findOrderByHash')
    //   const orderMock = {
    //     orderStatus: 'taken',
    //     txHex: 'partiallySignedHex',
    //     p2wdbHash: orderHash,
    //     orderHash
    //   }
    //   orderByHashStub.resolves(orderMock)
    //
    //   const offerByHashStub = sandbox.stub(uut.useCases.order, 'findOrderByHash')
    //   const offerMock = {
    //     txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000000003e8000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a100000001a045bd411acbb02ab31b1ac9a29cbd9e27001d5940a9291fc053d7683e716afc00000001f808d594b0360d20f7b4214bdb51a773d0f5eb34c5157eea285fefa5a86f5e16000000050000000000000834000000010000000000000000',
    //     p2wdbHash: orderHash,
    //     hdIndex: 3
    //   }
    //   offerByHashStub.resolves(orderMock)
    //
    //   const completeOrderStub = sandbox.stub(uut.useCases.order, 'completeOrder')
    //   completeOrderStub.resolves({ hash: 'hash', txid: 'txid' })
    //
    //   await uut.acceptOrder(ctx)
    //
    //   assert.isTrue(orderByHashStub.calledWith(orderHash))
    //   assert.isTrue(orderByHashStub.calledWith(orderHash))
    //   assert.isTrue(completeOrderStub.calledWith({
    //     orderTxHex: orderMock.txHex,
    //     hdIndex: orderMock.hdIndex,
    //     orderEntity: orderMock
    //   }))
    //   assert.hasAllKeys(ctx.body, ['txid'])
    //   assert.isTrue(handleErrorSpy.notCalled)
    // })

    // it('should throw and catch an error', async () => {
    //   ctx.request.body = { hash: orderHash }
    //
    //   const handleErrorSpy = sandbox.spy(uut, 'handleError')
    //   const orderByHashStub = sandbox.stub(uut.useCases.order, 'findOrderByHash')
    //   orderByHashStub.rejects(new Error('Order not found'))
    //
    //   try {
    //     await uut.acceptOrder(ctx)
    //   } catch (error) {
    //     assert.isTrue(orderByHashStub.calledWith(orderHash))
    //     assert.isTrue(handleErrorSpy.called)
    //   }
    // })
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
