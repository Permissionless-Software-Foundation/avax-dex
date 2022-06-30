const assert = require('chai').assert

const BCHJS = require('../../../src/adapters/bch')

const sinon = require('sinon')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const mockData = require('../mocks/bchjs-mock')

let sandbox
let uut
describe('bch', () => {
  beforeEach(() => {
    uut = new BCHJS()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#_verifySignature', () => {
    it('should return true for valid signature', () => {
      const offerBchAddr =
        'bitcoincash:qphjncqpnv444jq8acqk4dkm3296c50xhqggeatvn8'
      const signature =
        'Hz8bi9CsHaYkk5SGtHLU0aaxFspEXz7IdBNn6xV8ejE6OCuIRoZuVE9QJsGSlJ3Rt0ez2LWD0e292NZ84rRwnfk='
      const sigMsg = 'example.com'
      const verifyObj = { offerBchAddr, signature, sigMsg }

      const result = uut._verifySignature(verifyObj)

      assert.equal(result, true)
    })

    it('should return false for invalid signature', () => {
      const offerBchAddr =
        'bitcoincash:qphjncqpnv444jq8acqk4dkm3296c50xhqggeatvn8'
      const signature =
        'Hz8bi9CsHaYkk5SGtHLU0aaxFspEXz7IdBNn6xV8ejE6OCuIRoZuVE9QJsGSlJ3Rt0ez2LWD0e292NZ84rRwnfd='
      const sigMsg = 'example.com'
      const verifyObj = { offerBchAddr, signature, sigMsg }

      const result = uut._verifySignature(verifyObj)

      assert.equal(result, false)
    })

    it('should catch and throw errors', () => {
      try {
        // Force an error
        sandbox
          .stub(uut.bchjs.BitcoinCash, 'verifyMessage')
          .throws(new Error('test error'))

        const offerBchAddr =
          'bitcoincash:qphjncqpnv444jq8acqk4dkm3296c50xhqggeatvn8'
        const signature =
          'Hz8bi9CsHaYkk5SGtHLU0aaxFspEXz7IdBNn6xV8ejE6OCuIRoZuVE9QJsGSlJ3Rt0ez2LWD0e292NZ84rRwnfk='
        const sigMsg = 'example.com'
        const verifyObj = { offerBchAddr, signature, sigMsg }
        uut._verifySignature(verifyObj)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getPsfTokenBalance', () => {
    it('should throw error if slpAddress is not provided', async () => {
      try {
        await uut.getPsfTokenBalance()
        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'slpAddress must be a string')
      }
    })

    it('should return psf tokens balance', async () => {
      // Mock live network calls.
      sandbox
        .stub(uut.wallet.tokens, 'listTokensFromAddress')
        .resolves(mockData.psfBalances02)

      const slpAddress =
        'simpleledger:qp49th03gvjn58d6fxzaga6u09w4z56smyuk43lzkd'
      const result = await uut.getPsfTokenBalance(slpAddress)

      assert.isNumber(result)
      assert.equal(result, 118509.35345749)
    })

    it('should return 0 if the slp address does not have PSF tokens', async () => {
      // Mock live network calls.
      sandbox
        .stub(uut.wallet.tokens, 'listTokensFromAddress')
        .resolves(mockData.noPsfBalance02)

      const slpAddress =
        'simpleledger:qp49th03gvjn58d6fxzaga6u09w4z56smyuk43lzkd'
      const result = await uut.getPsfTokenBalance(slpAddress)
      // console.log('result: ', result)

      assert.isNumber(result)
      assert.equal(result, 0)
    })

    it('should return 0 if the slp address does not have any tokens', async () => {
      // Mock live network calls.
      sandbox
        .stub(uut.wallet.tokens, 'listTokensFromAddress')
        .resolves([])

      const slpAddress =
        'simpleledger:qp49th03gvjn58d6fxzaga6u09w4z56smyuk43lzkd'
      const result = await uut.getPsfTokenBalance(slpAddress)
      // console.log('result: ', result)

      assert.isNumber(result)
      assert.equal(result, 0)
    })
  })

  // describe('#getMerit', () => {
  //   it('should throw error if slpAddr is not provided', async () => {
  //     try {
  //       await uut.getMerit()
  //       assert.fail('Unexpected result')
  //     } catch (err) {
  //       assert.include(err.message, 'slpAddr must be a string')
  //     }
  //   })
  //
  //   it('should throw error if slpAddr provided is invalid type', async () => {
  //     try {
  //       await uut.getMerit(1)
  //       assert.fail('Unexpected result')
  //     } catch (err) {
  //       assert.include(err.message, 'slpAddr must be a string')
  //     }
  //   })
  //
  //   it('should return the merit ', async () => {
  //     // Mock live network calls.
  //     sandbox.stub(uut.msgLib.merit, 'agMerit').resolves(100)
  //
  //     const slpAddr =
  //         'simpleledger:qqgnksc6zr4nzxrye69fq625wu2myxey6uh9kzjy96'
  //     const merit = await uut.getMerit(slpAddr)
  //     assert.isNumber(merit)
  //   })
  // })
})
