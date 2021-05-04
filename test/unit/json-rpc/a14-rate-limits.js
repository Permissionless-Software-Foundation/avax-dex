/*
  Unit tests for the JSON RPC validator middleware.

  TODO: ensureTargetUserOrAdmin: it should exit quietly if user is an admin.
*/

// Public npm libraries
const sinon = require('sinon')
const assert = require('chai').assert

// Set the environment variable to signal this is a test.
process.env.SVC_ENV = 'test'

// Local libraries
const RateLimit = require('../../../src/rpc/rate-limit')

describe('#rate-limit', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new RateLimit()
  })

  afterEach(() => sandbox.restore())

  describe('#onLimitReached', () => {
    it('should throw error', async () => {
      try {
        uut.onLimitReached()
        assert.fail('unexpected error')
      } catch (error) {
        assert.equal(error.status, 429)
        assert.include(error.message, 'Too many requests, please try again later.')
      }
    })
  })
  describe('#limiter', () => {
    it('should throw error if "from" input is not provider', async () => {
      try {
        await uut.limiter()
        assert.fail('unexpected error')
      } catch (error) {
        assert.include(error.message, 'from must be a string')
      }
    })
    it('should throw error 429', async () => {
      try {
        const _uut = new RateLimit({ max: 1 })
        const from = 'Origin request'

        const firtsRequest = await _uut.limiter(from)
        assert.isTrue(firtsRequest)

        await _uut.limiter(from)
        assert.fail('unexpected error')
      } catch (error) {
        assert.include(error.message, 'Too many requests, please try again later.')
      }
    })
  })
})
