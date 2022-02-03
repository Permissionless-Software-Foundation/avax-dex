/*
  Unit tests for the Order Use Case library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local support libraries
// const testUtils = require('../../utils/test-utils')

// Unit under test (uut)
const OrderLib = require('../../../src/use-cases/order')
const adapters = require('../mocks/adapters')

describe('#order-use-case', () => {
  let uut
  let sandbox

  before(async () => {
    // Delete all previous users in the database.
    // await testUtils.deleteAllUsers()
  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new OrderLib({ adapters })
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new OrderLib()

        assert.fail('Unexpected code path')
        console.log(uut) // linter
      } catch (err) {
        assert.include(
          err.message,
          'Instance of adapters must be passed in when instantiating Order Use Cases library.'
        )
      }
    })
  })

  describe('#createOrder', () => {
    it('should ignore an offer if utxo has been spent', async () => {
      const orderObj = {
        appId: 'swapTest555',
        data: {
          messageType: 1,
          messageClass: 1,
          tokenId: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 10,
          numTokens: 0.02,
          utxoTxid: '23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa49732uJK',
          utxoVout: 1,
          txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b000',
          addrReferences: '{"23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa493fANVn":"X-avax1swa5l9h5cax8jwne2usxp88rwnr4n7t699hj0g"}'
        },
        timestamp: '2021-09-20T17:54:26.395Z',
        localTimeStamp: '9/20/2021, 10:54:26 AM',
        txid: '46f50f2a0cf44e3ed70dfb0618ef3ebfee57aabcf229b5d2d17c07322b54a8d7',
        hash: 'zdpuB2X25AZCKo3wpr4sSbw44vqPWJRqcxWQRHZccK5BdtoGD'
      }

      // Mock dependencies
      sandbox.stub(uut.adapters.bchjs.Blockchain, 'getTxOut').resolves(null)

      const result = await uut.createOrder(orderObj)
      // console.log('result: ', result)

      assert.equal(result, false)
    })

    it('should create an offer and return the hash', async () => {
      const orderObj = {
        appId: 'swapTest555',
        data: {
          messageType: 1,
          messageClass: 1,
          tokenId: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 10,
          numTokens: 0.02,
          utxoTxid: '23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa49732uJK',
          utxoVout: 1,
          txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b000',
          addrReferences: '{"23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa493fANVn":"X-avax1swa5l9h5cax8jwne2usxp88rwnr4n7t699hj0g"}'
        },
        timestamp: '2021-09-20T17:54:26.395Z',
        localTimeStamp: '9/20/2021, 10:54:26 AM',
        txid: '46f50f2a0cf44e3ed70dfb0618ef3ebfee57aabcf229b5d2d17c07322b54a8d7',
        hash: 'zdpuB2X25AZCKo3wpr4sSbw44vqPWJRqcxWQRHZccK5BdtoGD'
      }

      // Mock dependencies
      sandbox.stub(uut.adapters.wallet, 'getTxOut').resolves({
        asset: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si',
        amount: 100,
        address: 'X-avax1l9g0vqng5jkd8xupdn8nshhlhcdm6nszkqw7zh',
        status: 'unspent'
      })

      const result = await uut.createOrder(orderObj)
      // console.log('result: ', result)

      assert.equal(result, true)
    })

    it('should throw an error', async () => {
      sandbox.stub(uut.adapters.wallet, 'getTxOut').rejects(new Error('intended error'))
      const orderObj = {
        appId: 'swapTest555',
        data: {
          messageType: 1,
          messageClass: 1,
          tokenId: '2aK8oMc5izZbmSsBiNzb6kPNjXeiQGPLUy1sFqoF3d9QEzi9si',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 10,
          numTokens: 0.02,
          utxoTxid: '23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa49732uJK',
          utxoVout: 1,
          txHex: '00000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b000',
          addrReferences: '{"23SvdJmF5VMTnSVxBW8VfoMQ6zwFmJoUY3J61KvuKa493fANVn":"X-avax1swa5l9h5cax8jwne2usxp88rwnr4n7t699hj0g"}'
        },
        timestamp: '2021-09-20T17:54:26.395Z',
        localTimeStamp: '9/20/2021, 10:54:26 AM',
        txid: '46f50f2a0cf44e3ed70dfb0618ef3ebfee57aabcf229b5d2d17c07322b54a8d7',
        hash: 'zdpuB2X25AZCKo3wpr4sSbw44vqPWJRqcxWQRHZccK5BdtoGD'
      }

      try {
        await uut.createOrder(orderObj)
        assert.fail('unexpected path')
      } catch (error) {
        assert.include(error.message, 'intended error')
      }
    })
  })

  describe('#listOrders', () => {
    it('should return a list of offers', async () => {
      sandbox.stub(uut.OrderModel, 'find').resolves([{
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

      const orders = await uut.listOrders()

      assert.isArray(orders)
      assert.hasAllKeys(orders[0], [
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
        'timestamp',
        'localTimestamp',
        'p2wdbHash'
      ])
    })
  })

  describe('#findOrder', () => {
    it('should return an order entity', async () => {
      const findByIdStub = sandbox.stub(uut.OrderModel, 'findById')

      findByIdStub.resolves({
        toObject: () => ({
          _id: '61e90c1295e85a0efb36220b',
          messageType: 1,
          messageClass: 1,
          tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 10,
          numTokens: 1,
          utxoTxid: 'hTmmsBQuBmR91X9xE2cNuveLd45ox7oAGvZukczQHXhQzAKMy',
          utxoVout: 1,
          timestamp: '2022-01-20T07:15:20.744Z',
          localTimestamp: '1/20/2022, 3:15:20 AM',
          p2wdbHash: 'zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2',
          __v: 0,
          txHex: 'hex',
          addrReferences: '{}'
        })
      })

      const order = await uut.findOrder('61e90c1295e85a0efb36220b')

      assert.hasAllKeys(order, [
        'messageType',
        'messageClass',
        'tokenId',
        'buyOrSell',
        'rateInSats',
        'minSatsToExchange',
        'numTokens',
        'utxoTxid',
        'utxoVout',
        'orderStatus',
        'txHex',
        'addrReferences',
        'timestamp',
        'localTimestamp',
        'txid',
        'p2wdbHash',
        'offerHash'
      ])
      assert.isTrue(findByIdStub.calledWith('61e90c1295e85a0efb36220b'))
    })

    it('should throw an error', async () => {
      const findByIdStub = sandbox.stub(uut.OrderModel, 'findById')
      findByIdStub.resolves(null)
      try {
        await uut.findOrder('61e90c1295e85a0efb36220b')
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'order not found')
      }
    })
  })

  describe('#takeOrder', () => {
    it('should partially sign the transcation and send it to the p2wdb', async () => {
      const orderEntity = {
        messageType: 1,
        messageClass: 1,
        tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
        buyOrSell: 'sell',
        rateInSats: 1000,
        minSatsToExchange: 10,
        numTokens: 1,
        utxoTxid: 'hTmmsBQuBmR91X9xE2cNuveLd45ox7oAGvZukczQHXhQzAKMy',
        utxoVout: 1,
        orderStatus: 'posted',
        txHex: 'hex',
        addrReferences: '{}',
        timestamp: '2022-01-20T07:15:20.744Z',
        localTimestamp: undefined,
        txid: undefined,
        p2wdbHash: 'zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2'
      }

      const TxStub = sinon.stub(uut.adapters.wallet, 'takePartialTxHex')
      TxStub.resolves({
        txHex: 'hex',
        addrReferences: '{}'
      })

      const writeStub = sandbox.stub(uut.adapters.p2wdb, 'write')
      writeStub.resolves('somehash')

      const hash = await uut.takeOrder(orderEntity)

      assert.equal(hash, 'somehash')
      assert.isTrue(TxStub.called)
      assert.isTrue(writeStub.called)
    })

    it('should throw an error', async () => {
      const orderEntity = { orderStatus: 'taken' }

      try {
        await uut.takeOrder(orderEntity)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'order already taken')
      }
    })
  })

  describe('#checkTakenOrder', () => {
    const offerHash = 'zdpuB1yPwL9FdpvtD5rP7b2Pk77ZdNNVzn2hG2KEvYmij1UE2'

    it('should return the order if the offer has been taken', async () => {
      const validateFromModelStub = sandbox.spy(uut.orderEntity, 'validateFromModel')
      const findOneStub = sandbox.stub(uut.OrderModel, 'findOne')
      findOneStub.resolves({
        toObject: () => ({
          _id: '61e96b2b97bb460640e211d6',
          messageType: 1,
          messageClass: 1,
          tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
          buyOrSell: 'sell',
          rateInSats: 1000,
          minSatsToExchange: 10,
          numTokens: 1,
          utxoTxid: 'hTmmsBQuBmR91X9xE2cNuveLd45ox7oAGvZukczQHXhQzAKMy',
          utxoVout: 1,
          orderStatus: 'taken',
          txHex: '0000000000000000000',
          addrReferences: '{}',
          timestamp: '2022-01-20T14:01:05.410Z',
          localTimestamp: '1/20/2022, 10:01:05 AM',
          offerHash,
          p2wdbHash: 'zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2',
          __v: 0
        })
      })

      const order = await uut.checkTakenOrder(offerHash)
      assert.hasAllKeys(order, [
        'messageType',
        'messageClass',
        'tokenId',
        'buyOrSell',
        'rateInSats',
        'minSatsToExchange',
        'numTokens',
        'utxoTxid',
        'utxoVout',
        'orderStatus',
        'txHex',
        'addrReferences',
        'timestamp',
        'localTimestamp',
        'txid',
        'p2wdbHash',
        'offerHash'
      ])
      assert.isTrue(validateFromModelStub.called)
      assert.isTrue(findOneStub.called)
      assert.isTrue(findOneStub.calledWith({ offerHash, orderStatus: 'taken' }))
    })

    it('should return false if the offer has not been taken yet', async () => {
      const validateFromModelStub = sandbox.stub(uut.orderEntity, 'validateFromModel')
      const findOneStub = sandbox.stub(uut.OrderModel, 'findOne')
      findOneStub.resolves(null)

      const res = await uut.checkTakenOrder(offerHash)

      assert.isTrue(findOneStub.called)
      assert.isTrue(findOneStub.calledWith({ offerHash, orderStatus: 'taken' }))
      assert.isFalse(res)
      assert.isFalse(validateFromModelStub.called)
    })

    it('should throw an error', async () => {
      const validateFromModelStub = sandbox.stub(uut.orderEntity, 'validateFromModel')
      const findOneStub = sandbox.stub(uut.OrderModel, 'findOne')
      findOneStub.rejects(new Error('intended error'))

      try {
        await uut.checkTakenOrder(offerHash)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'intended error')

        assert.isTrue(findOneStub.called)
        assert.isTrue(findOneStub.calledWith({ offerHash, orderStatus: 'taken' }))
        assert.isFalse(validateFromModelStub.called)
      }
    })
  })
})
