/*
  Integration tests for the bch.js adapter library.
*/

// Local libraries
const BCH = require('../../../../src/adapters/bch')

describe('#bch.js', () => {
  let uut

  beforeEach(() => {
    uut = new BCH()
  })

  describe('#getPsfTokenBalance2', () => {
    it('should get the PSF token balance for an address', async () => {
      const addr = 'simpleledger:qr9xtwn9u22wqh7j00fy6k4jg9ktmdn69u8gk3mmdf'

      const result = await uut.getPsfTokenBalance2(addr)
      console.log('result: ', result)
    })
  })
})
