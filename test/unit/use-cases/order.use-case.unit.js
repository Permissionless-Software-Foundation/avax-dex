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
          utxoVout: 1
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
          utxoVout: 1
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
  })
})
