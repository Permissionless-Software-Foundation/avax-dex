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

describe('#Order-REST-Router', () => {
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
        appId: 'swapTest555',
        data: {
          messageType: 1,
          messageClass: 1,
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 10,
          numTokens: 0.02,
          utxoTxid:
            '241c06bf61384b8623477e419bf4779edbcc7e3bc862f0f179a9ed2967069b87',
          utxoVout: 0
        },
        timestamp: '2021-09-20T17:54:26.395Z',
        localTimeStamp: '9/20/2021, 10:54:26 AM',
        txid: '46f50f2a0cf44e3ed70dfb0618ef3ebfee57aabcf229b5d2d17c07322b54a8d7',
        hash: 'zdpuB2X25AZCKo3wpr4sSbw44vqPWJRqcxWQRHZccK5BdtoGD'
      }

      // Mock dependencies
      // sandbox.stub(uut.useCases.order, 'createOrder').resolves()

      await uut.createOrder(ctx)

      // assert.equal(ctx.body.hash, 'testHash')
    })

    // it('should catch and throw an error', async () => {
    //   try {
    //     ctx.request.body = {
    //       order: {}
    //     }
    //
    //     // Force an error
    //     sandbox
    //       .stub(uut.useCases.order, 'createOrder')
    //       .rejects(new Error('test error'))
    //
    //     await uut.createOrder(ctx)
    //
    //     assert.fail('Unexpected code path')
    //   } catch (err) {
    //     // console.log('err: ', err)
    //     assert.include(err.message, 'test error')
    //   }
    // })
  })

  describe('#listOrders', () => {
    it('should run the correct methods', async () => {
      sandbox.stub(uut.useCases.order, 'listOrders').resolves([{
        _id: '61d8c3b6faabfd0d5f18cae9',
        messageType: 1,
        messageClass: 1,
        tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
        buyOrSell: 'sell',
        rateInSats: '1000',
        minSatsToExchange: '10',
        numTokens: 21,
        utxoTxid: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
        utxoVout: 1,
        timestamp: '',
        localTimestamp: '',
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

  describe('#takeOrder', () => {
    it('should create a new order with a partially signed tx', async () => {
      const order = {
        p2wdbHash: 'zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2',
        txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c' +
          '4b0000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a8' +
          '7dff0000000700000000000003e8000000000000000000000001000000012a911a32b2' +
          'dcfa390b020b406131df356b84a2a1000000015bdf7b977813f604ac5c285f4571db90' +
          '6afdf4e1197e2a39e9284a73976e269100000001f808d594b0360d20f7b4214bdb51a7' +
          '73d0f5eb34c5157eea285fefa5a86f5e16000000050000000000000064000000010000' +
          '000000000000',
        addrReferences: '{"hTmmsBQuBmR91X9xE2cNuveLd45ox7oAGvZukczQHXhKhuaa4":"X-avax15d4zzjxsl02qpx60xupnz7z3sxagans7dwgyzj"}'
      }

      const findOrderStub = sinon.stub(uut.useCases.order, 'findOrder')
      const takeOrderStub = sinon.stub(uut.useCases.order, 'takeOrder')
      findOrderStub.resolves(order)

      ctx.request.body = {
        orderId: '61e90c1295e85a0efb36220b'
      }

      await uut.takeOrder(ctx)

      assert.isTrue(findOrderStub.calledWith('61e90c1295e85a0efb36220b'))
      assert.isTrue(takeOrderStub.calledWith(order))
    })

    it('should catch and throw an error', async () => {
      ctx.request.body = {
        orderId: '61e90c1295e85a0efb36220b'
      }

      const takeOrderStub = sinon.stub(uut.useCases.order, 'takeOrder')
      const findOrderStub = sinon.stub(uut.useCases.order, 'findOrder')
      findOrderStub.rejects(new Error('test error'))

      try {
        await uut.takeOrder(ctx)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
        assert.isTrue(findOrderStub.calledWith('61e90c1295e85a0efb36220b'))
        assert.isTrue(takeOrderStub.notCalled)
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
