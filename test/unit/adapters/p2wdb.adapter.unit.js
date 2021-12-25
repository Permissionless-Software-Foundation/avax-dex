/*
  Unit tests for the p2wdb adapter library.
*/

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')

// Local libraries.
const P2wdbAdapter = require('../../../src/adapters/p2wdb')

// Mocks
const { Write: WriteMock } = require('../mocks/adapters/p2wdb-mock')

describe('#P2wdbAdapter', () => {
  /** @type {P2wdbAdapter} */
  let uut
  /** @type {sinon.SinonSandbox} */
  let sandbox

  beforeEach(() => {
    uut = new P2wdbAdapter()
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#checkForSufficientFunds', () => {
    beforeEach(() => { uut.Write = WriteMock })

    it('should return true if the parameters are valid', async () => {
      const res = await uut.checkForSufficientFunds('validWif')

      assert.isTrue(res)
    })

    it('should return false if the given address doesnt have enough', async () => {
      const res = await uut.checkForSufficientFunds('emptyAddress')

      assert.isFalse(res)
    })

    it('should throw and catch an error', async () => {
      try {
        await uut.checkForSufficientFunds()
        assert.fail('unexpected result')
      } catch (error) {
        assert.equal(error.message, 'invalid wif to check for funds')
      }
    })
  })

  describe('#write', () => {
    it('should write an offer to the P2WDB', async () => {
      const inputObj = {
        wif: 'validWif',
        appId: 'testAppId',
        key: 'value'
      }

      // Mock Write class to prevent live network call
      uut.Write = WriteMock
      const result = await uut.write(inputObj)

      assert.equal(result, 'testhash')
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.write()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'WIF private key required when instantiating P2WDB Write library.')
      }
    })
  })
})
