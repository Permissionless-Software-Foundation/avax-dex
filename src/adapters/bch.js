/*
  This library contains methods for working with the BCHN and BCHA blockchains.
*/

// Public npm libraries
const BCHJS = require('@psf/bch-js')
const MsgLib = require('bch-message-lib/index')
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const config = require('../../config')

class Bch {
  constructor () {
    // Encapsulate dependencies
    this.bchjs = new BCHJS()
    this.PSF_TOKEN_ID =
      '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
    this.wallet = new BchWallet(undefined, { noUpdate: true })
    this.msgLib = new MsgLib({ wallet: this.wallet })
    this.config = config
  }

  // Verify that the entry was signed by a specific BCH address.
  _verifySignature (verifyObj) {
    try {
      // Expand the input object.
      const { offerBchAddr, signature, sigMsg } = verifyObj

      // Convert to BCH address.
      // const scrubbedAddr = this.bchjs.SLP.Address.toCashAddress(slpAddress)

      const isValid = this.bchjs.BitcoinCash.verifyMessage(
        offerBchAddr,
        signature,
        sigMsg
      )

      return isValid
    } catch (err) {
      console.error('Error in bch.js/_verifySignature()')
      throw err
    }
  }

  // Get the PSF token balance for a given address.
  async getPsfTokenBalance (slpAddress) {
    try {
      // Input validation
      if (!slpAddress || typeof slpAddress !== 'string') {
        throw new Error('slpAddress must be a string')
      }

      // let psfBalance = 0
      const tokenBalances = await this.wallet.tokens.listTokensFromAddress(slpAddress)
      // console.log(`tokenBalances: ${JSON.stringify(tokenBalances, null, 2)}`)

      const psfTokens = tokenBalances.filter(x => x.tokenId === this.PSF_TOKEN_ID)
      // console.log('psfTokens: ', psfTokens)

      // If no PSF tokens can be found, return 0.
      if (psfTokens.length === 0) return 0

      return psfTokens[0].qty
    } catch (err) {
      console.error('Error in bch.js/getPSFTokenBalance()')
      throw err
    }
  }

  // async getMerit (slpAddr) {
  //   try {
  //     if (!slpAddr || typeof slpAddr !== 'string') {
  //       throw new Error('slpAddr must be a string')
  //     }
  //     const merit = await this.msgLib.merit.agMerit(slpAddr, this.PSF_TOKEN_ID)
  //     return merit
  //   } catch (error) {
  //     console.error('error in bch.js/getMerit()')
  //     throw error
  //   }
  // }
}

module.exports = Bch
