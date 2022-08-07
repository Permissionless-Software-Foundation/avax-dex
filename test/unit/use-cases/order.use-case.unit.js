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
          name: 'testName',
          symbol: 'testSymbol',
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
          name: 'testName',
          symbol: 'testSymbol',
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
        name: 'testName',
        symbol: 'testSymbol',
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
      assert.hasAnyKeys(orders[0], [
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
          name: 'testName',
          symbol: 'testSymbol',
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

      assert.hasAnyKeys(order, [
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
        name: 'testName',
        symbol: 'testSymbol',
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

      const TxStub = sandbox.stub(uut.adapters.wallet, 'takePartialTxHex')
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
          name: 'testName',
          symbol: 'testSymbol',
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
      assert.hasAnyKeys(order, [
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

  describe('#findOrderByHash', () => {
    it('should return an order by a given p2wdb hash', async () => {
      const findOne = sandbox.stub(uut.OrderModel, 'findOne')

      findOne.resolves({
        toObject: () => ({
          _id: '61e90c1295e85a0efb36220b',
          messageType: 1,
          messageClass: 1,
          tokenId: '2tEi6r6PZ9VXHogUmkCzvijmW81TRNjtKWnR4FA55zTPc87fxC',
          name: 'testName',
          symbol: 'testSymbol',
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

      const order = await uut.findOrderByHash('zdpuB21PDBFyTfrckbJA8c339KgYudQydqEvU7xgUuqNnoWh2')

      assert.hasAnyKeys(order, [
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
    })

    it('should throw an error if the given hash is not a string', async () => {
      const consoleSpy = sandbox.spy(global.console, 'error')
      const findSpy = sandbox.spy(uut.OrderModel, 'findOne')

      try {
        await uut.findOrderByHash()
      } catch (error) {
        assert.include(error.message, 'p2wdbHash must be a string')
        assert.isTrue(consoleSpy.called)
        assert.isTrue(findSpy.notCalled)
      }
    })

    it('should throw an error if the given hash doesnt match any offer', async () => {
      const consoleSpy = sandbox.spy(global.console, 'error')
      const findSpy = sandbox.stub(uut.OrderModel, 'findOne')
      findSpy.resolves(null)
      try {
        await uut.findOrderByHash('zdpuAowSDiCFRffMBv4bv4zsNHzVpStqDKZU4UBKpiyEsVoHE')
      } catch (error) {
        assert.include(error.message, 'order not found')
        assert.isTrue(consoleSpy.called)
        assert.isTrue(findSpy.called)
      }
    })
  })

  describe('#completeOrder', () => {
    it('should throw an error if the orderStatus is different than taken', async () => {
      try {
        const mockArgs = { offerTxHex: '', hdIndex: 0, orderEntity: { orderStatus: 'posted' } }
        await uut.completeOrder(mockArgs)
      } catch (error) {
        assert.equal('orderStatus must be taken', error.message)
      }
    })

    it('should throw an error if the tx is not valid', async () => {
      const consoleSpy = sandbox.spy(global.console, 'error')
      const integrityStub = sandbox.stub(uut.adapters.wallet, 'validateIntegrity')
      integrityStub.resolves({ valid: false, message: 'intended error for testing' })

      try {
        const mockArgs = { offerTxHex: '', hdIndex: 0, orderEntity: { orderStatus: 'taken' } }
        await uut.completeOrder(mockArgs)
      } catch (error) {
        assert.equal('intended error for testing', error.message)
        assert.isTrue(consoleSpy.called)
      }
    })

    it('should complete signing the trasaction, broadcast, and write it to the p2wdb', async () => {
      const consoleSpy = sandbox.spy(global.console, 'error')
      const integrityStub = sandbox.stub(uut.adapters.wallet, 'validateIntegrity')
      const completeStub = sandbox.stub(uut.adapters.wallet, 'completeTxHex')
      const writeStub = sandbox.stub(uut.adapters.p2wdb, 'write')

      integrityStub.resolves({ valid: true })
      completeStub.resolves('txid')
      writeStub.resolves('hash')

      const addrReferences = {
        Bmf8WUVKkiP97rFf3vFERoiWZy634WfpMKuWrJJ1x3YjMLcbi: 'X-avax1jzrstc0mvwk9m4hqmz0fyxcvx2mkzwdtmqpppr',
        hTmmsBQuBmR91X9xE2cNuveLd45ox7oAGvZukczQHXhKhuaa3: 'X-avax192g35v4jmnarjzczpdqxzvwlx44cfg4p0yk4qd'
      }

      const mockArgs = {
        offerTxHex: '',
        hdIndex: 0,
        orderEntity: {
          orderStatus: 'taken',
          txHex: '00000000000000000001ed5f38341e436e5d46e2bb00b45d62ae97d1b050c64bc634ae10626739e35c4b0000000321e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000005b8d80000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000007000000000098968000000000000000000000000100000001908705e1fb63ac5dd6e0d89e921b0c32b76139abe49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c645000000070000000000000064000000000000000000000001000000012a911a32b2dcfa390b020b406131df356b84a2a10000000218745a2beff9066fa451d26bd869b9d893fe106c23f990ce39bae861f5e7cb5e00000001e49b53ab21c6f7b10bf8efb3e3bc0059954989b3d481a9cb862f4b0b7d57c64500000005000000000000006400000001000000005bdf7b977813f604ac5c285f4571db906afdf4e1197e2a39e9284a73976e26910000000021e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000000050000000001036640000000010000000000000022547820637265617465642066726f6d206f666665722074616b6520636f6d6d616e640000000200000009000000000000000900000001697ad8096a0f48aaf3bca4c151375f1ffee13f582e0c6c933f1d3d27cad78ebe6bdc4726131e5b0c3325e365bd0735cac870a5f5422a6bc6a05ad12d0c65bcd500',
          addrReferences: JSON.stringify(addrReferences)
        }
      }
      const res = await uut.completeOrder(mockArgs)

      assert.hasAllKeys(res, ['txid'])
      assert.equal(res.txid, 'txid')
      // assert.equal(res.hash, 'hash')
      assert.isTrue(consoleSpy.notCalled)
      // assert.isTrue(writeStub.called)
      assert.isTrue(integrityStub.calledWith(mockArgs.offerTxHex, mockArgs.orderEntity.txHex))
      assert.isTrue(
        completeStub.calledWith(
          mockArgs.orderEntity.txHex,
          addrReferences,
          mockArgs.hdIndex
        )
      )
    })
  })
})
