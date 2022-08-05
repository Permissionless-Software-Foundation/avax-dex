/*
  REST API Controller library for the /offer route
*/

// const { wlogger } = require('../../../adapters/wlogger')

// let _this

class MnemonicRESTControllerLib {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /mnemonic REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /mnemonic REST Controller.'
      )
    }

    // Bind 'this' context to event handlers.
    this.getMnemonics = this.getMnemonics.bind(this)

    // Encapsulate dependencies
    // this.OrderModel = this.adapters.localdb.Order
    // this.userUseCases = this.useCases.user

    // _this = this
  }

  /**
   * @api {get} /mnemonic Get mnemonics used to control the app wallets
   * @apiPermission public
   * @apiName GetMnemonic
   * @apiGroup REST Mnemonic
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5700/mnemonic
   *
   */
  async getMnemonics (ctx) {
    console.log('getMnemonics REST API handler called.')

    const avaxMnemonic = this.adapters.wallet.mnemonics.avax
    console.log('avaxMnemonic: ', avaxMnemonic)

    const bchMnemonic = this.adapters.wallet.mnemonics.bch
    console.log('bchMnemonic: ', bchMnemonic)

    ctx.body = {
      success: true,
      avaxMnemonic,
      bchMnemonic
    }
  }

  // DRY error handler
  handleError (ctx, err) {
    console.log('err', err.message)
    // If an HTTP status is specified by the buisiness logic, use that.
    if (err.status) {
      if (err.message) {
        ctx.throw(err.status, err.message)
      } else {
        ctx.throw(err.status)
      }
    } else {
      // By default use a 422 error if the HTTP status is not specified.
      ctx.throw(422, err.message)
    }
  }
}

module.exports = MnemonicRESTControllerLib
